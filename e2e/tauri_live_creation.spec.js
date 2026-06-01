import { test, expect, chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

test('Tauri Live Full Flow: Create, Select Stack, Scaffold, Import, Details, Sync, Quick Install, Update, Revert, and Bulk Actions', async () => {
  // Set test timeout to 180 seconds because npm install/update operations take time
  test.setTimeout(180000);

  const scratchDir = path.resolve(__dirname, '../scratch/test-project-full');
  if (fs.existsSync(scratchDir)) {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }
  // Ensure the parent directory exists so current_dir doesn't fail
  fs.mkdirSync(scratchDir, { recursive: true });

  // 1. Check if Tauri is already running with remote debugging active
  let alreadyRunning = false;
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      alreadyRunning = true;
      console.log('Tauri WebView2 remote debugging port is already running!');
    }
  } catch (e) {
    // Port not open
  }

  let tauriProcess;
  if (!alreadyRunning) {
    // Programmatically launch the Tauri dev app with debugging enabled
    console.log('Starting Tauri development server...');
    tauriProcess = spawn('npm', ['run', 'tauri', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9222 --disable-shared-workers --disable-service-workers'
      },
      shell: true
    });

    tauriProcess.stdout.on('data', (data) => console.log(`[Tauri Output] ${data}`));
    tauriProcess.stderr.on('data', (data) => console.error(`[Tauri Error] ${data}`));

    // Poll the remote debugging port until it is open
    let ready = false;
    console.log('Waiting for Tauri WebView2 remote debugging port 9222 to start...');
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch('http://127.0.0.1:9222/json/version');
        if (res.ok) {
          ready = true;
          break;
        }
      } catch (e) { }
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if (!ready) {
      tauriProcess.kill('SIGINT');
      throw new Error('Tauri WebView2 debugging port 9222 did not open after 60 seconds.');
    }
  }

  let browser;
  try {
    // 2. Fetch browser websocket URL and connect
    console.log('Retrieving browser-level websocket URL...');
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    const browserWsUrl = versionData.webSocketDebuggerUrl;
    console.log(`Connecting directly to browser WS: ${browserWsUrl}`);

    browser = await chromium.connectOverCDP(browserWsUrl);
    const context = browser.contexts()[0];

    // Wait for contexts to populate page targets
    let page = context.pages()[0];
    if (!page) {
      console.log('Waiting for Playwright context pages to initialize...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      page = context.pages()[0];
    }

    if (!page) {
      throw new Error('Failed to retrieve page target after connection.');
    }

    await page.bringToFront();

    page.on('console', msg => console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[Browser PageError] ${err.message}`));

    // 3. Inject E2E mocks (especially folder picker) using addInitScript before reload
    console.log('Injecting E2E testing folder mock into live session...');
    await page.addInitScript((mockPath) => {
      try {
        if (window.__TAURI_INTERNALS__) {
          const originalInvoke = window.__TAURI_INTERNALS__.invoke;
          window.__TAURI_INTERNALS__.invoke = async (cmd, args, ...rest) => {
            if (cmd === 'pick_folder') {
              console.log(`[Playwright Mock] pick_folder intercepted, returning: ${mockPath}`);
              return mockPath;
            }
            return originalInvoke(cmd, args, ...rest);
          };
          console.log('[Playwright Mock] Successfully wrapped existing window.__TAURI_INTERNALS__.invoke');
        } else {
          let internals = null;
          try {
            Object.defineProperty(window, '__TAURI_INTERNALS__', {
              get() { return internals; },
              set(val) {
                internals = val;
                if (val && !val._invokeWrapped) {
                  val._invokeWrapped = true;
                  const originalInvoke = val.invoke;
                  val.invoke = async (cmd, args, ...rest) => {
                    if (cmd === 'pick_folder') {
                      console.log(`[Playwright Mock] pick_folder intercepted, returning: ${mockPath}`);
                      return mockPath;
                    }
                    return originalInvoke(cmd, args, ...rest);
                  };
                }
              },
              configurable: true,
              enumerable: true
            });
            console.log('[Playwright Mock] Configured setter for window.__TAURI_INTERNALS__');
          } catch (definePropertyErr) {
            console.error('[Playwright Mock] Failed to define window.__TAURI_INTERNALS__ property:', definePropertyErr);
          }
        }
      } catch (e) {
        console.error('[Playwright Mock] Error injecting mock:', e);
      }
    }, scratchDir);

    // Reload the page so the init script takes effect on a fresh session
    console.log('Reloading page to apply mocks...');
    await page.reload();

    // Wait for the main page to render the PEEAK header
    await expect(page.locator('text=PEEAK')).toBeVisible({ timeout: 15000 });

    // Clean up dashboard projects for a deterministic clean run using the UI directly
    console.log('Cleaning up existing projects from dashboard...');
    await page.waitForTimeout(1000);
    const removeButtons = page.locator('button[title="Remove project from PEEAK"]');
    const count = await removeButtons.count();
    for (let i = 0; i < count; i++) {
      await removeButtons.first().click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByRole('heading', { name: 'Project Manager' })).toBeVisible({ timeout: 10000 });

    // 4. Start the Project Creation Studio Flow
    console.log('Clicking Create Project...');
    const createBtn = page.getByRole('button', { name: 'Create Project' });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Verify we are inside the creation studio
    await expect(page.locator('text=Project Studio')).toBeVisible();

    // Select "React + Vite" template card
    const reactCard = page.locator('text=React + Vite');
    await expect(reactCard).toBeVisible();
    await reactCard.click();

    // Change Project Name to 'test-project-full'
    const nameInput = page.locator('input[placeholder="my-awesome-app"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('test-project-full');
    }

    // Trigger the Browse button (intercepted by our page mock)
    const browseBtn = page.getByRole('button', { name: 'Browse' });
    await expect(browseBtn).toBeVisible();
    await browseBtn.click();

    // Start building/scaffolding
    const buildBtn = page.getByRole('button', { name: 'Initialize Workspace' });
    await expect(buildBtn).toBeVisible();
    console.log('Triggering project creation build...');
    await buildBtn.click();

    // Wait for the build phase transitions (scaffolding code on disk)
    console.log('Waiting for scaffolding to complete...');

    const selectDropdown = page.locator('select');
    await expect(selectDropdown).toBeVisible({ timeout: 60000 });
    await selectDropdown.selectOption('deped');

    // Click Open Project
    console.log('Scaffolding complete! Clicking Open Project (Direct Import)...');
    const openProjectBtn = page.getByRole('button', { name: 'Open Project' });
    await expect(openProjectBtn).toBeVisible();
    await openProjectBtn.click();

    // Now wait for the transition to Project Details
    console.log('Waiting for Project Details view to render...');
    await expect(page.locator('text=Project Details')).toBeVisible({ timeout: 25000 });

    // Verify project name in header matches
    await expect(page.locator('h3:has-text("test-project-full")').first()).toBeVisible();

    // 5. Trigger Project Sync
    console.log('Triggering initial project sync...');
    const syncBtn = page.getByRole('button', { name: 'Sync' });
    await expect(syncBtn).toBeVisible();
    await syncBtn.click();

    // 6. Test Quick Install of an older version of package (e.g. canvas-confetti@1.0.0)
    console.log('Searching package in Quick Install panel...');
    const searchInput = page.getByPlaceholder('Search packages...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('canvas-confetti');

    const searchBtn = page.getByRole('button', { name: 'Search' });
    await searchBtn.click();

    console.log('Waiting for search results...');
    // Locate the canvas-confetti item in results
    const canvasConfettiResult = page.locator('text=canvas-confetti').first();
    await expect(canvasConfettiResult).toBeVisible({ timeout: 15000 });

    // First, let\'s install version 1.0.0 specifically so we can update it later.
    console.log('Installing canvas-confetti@1.0.0...');
    await searchInput.fill('canvas-confetti@1.0.0');
    await searchBtn.click();

    // Click the download button for our result
    const downloadIconBtn = page.locator('button:has(.lucide-download)').first();
    await expect(downloadIconBtn).toBeVisible({ timeout: 10000 });
    await downloadIconBtn.click();

    console.log('Waiting for installation of canvas-confetti@1.0.0 to complete...');
    // It should appear in the packages list
    const packageCardItem = page.locator('h3', { hasText: 'canvas-confetti' });
    await expect(packageCardItem).toBeVisible({ timeout: 45000 });

    // Check if the version of installed canvas-confetti is v1.0.0
    await expect(page.locator('text=v1.0.0')).toBeVisible({ timeout: 10000 });
    console.log('Successfully installed canvas-confetti@1.0.0!');

    // 7. Check for Update to show "Update" button
    console.log('Clicking Check for Update to find newer version...');
    const checkUpdateBtn = page.getByRole('button', { name: 'Check for Update' });
    await expect(checkUpdateBtn).toBeVisible();
    await checkUpdateBtn.click();

    // Wait for the update button on the canvas-confetti card to appear
    console.log('Waiting for Update button to appear on canvas-confetti card...');
    const updateCardBtn = page.locator('button:has-text("Update")').first();
    await expect(updateCardBtn).toBeVisible({ timeout: 25000 });

    // 8. Test Package Update
    console.log('Clicking Update on canvas-confetti card...');
    await updateCardBtn.click();

    // Wait until it finishes updating (version should become higher than v1.0.0, e.g. v1.9.3 or similar)
    console.log('Waiting for update to finish...');
    await expect(page.locator('text=v1.0.0')).not.toBeVisible({ timeout: 35000 });
    console.log('Successfully updated package!');

    // 9. Test Revert functionality
    console.log('Opening package actions dropdown menu to test revert...');
    const optionsMenuBtn = page.locator('button:has(.lucide-more-vertical)').first();
    await optionsMenuBtn.click();

    const revertOption = page.locator('text=Revert to v1.0.0');
    await expect(revertOption).toBeVisible();
    console.log('Clicking Revert to v1.0.0...');
    await revertOption.click();

    // Wait until version is reverted back to v1.0.0
    await expect(page.locator('text=v1.0.0')).toBeVisible({ timeout: 35000 });
    console.log('Successfully reverted canvas-confetti to v1.0.0!');

    // 10. Install another package to test Selected Actions (bulk actions)
    console.log('Installing semver@7.0.0 to test bulk actions...');
    await searchInput.fill('semver@7.0.0');
    await searchBtn.click();

    const downloadSemverBtn = page.locator('button:has(.lucide-download)').first();
    await expect(downloadSemverBtn).toBeVisible({ timeout: 10000 });
    await downloadSemverBtn.click();

    const semverCardItem = page.locator('h3', { hasText: 'semver' });
    await expect(semverCardItem).toBeVisible({ timeout: 45000 });
    console.log('Installed semver@7.0.0!');

    // 11. Test Selected Update & Selected Delete
    console.log('Selecting canvas-confetti and semver packages...');
    // Click checkboxes
    const checkboxes = page.locator('button[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();

    // Check both packages
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await checkboxes.nth(i).click();
    }

    // Wait for bulk action bar
    console.log('Verifying bulk action bar is visible...');
    await expect(page.locator('text=Delete Selected')).toBeVisible();
    await expect(page.locator('text=Update Selected')).toBeVisible();

    // Click Delete Selected
    console.log('Testing bulk delete...');
    const deleteSelectedBtn = page.locator('button:has-text("Delete Selected")');
    await deleteSelectedBtn.click();

    // Confirm delete dialog
    console.log('Confirming bulk delete in modal...');
    const confirmDeleteBtn = page.locator('button:has-text("Confirm Delete")');
    await expect(confirmDeleteBtn).toBeVisible();
    await confirmDeleteBtn.click();

    // Check they are removed
    await expect(packageCardItem).not.toBeVisible({ timeout: 15000 });
    await expect(semverCardItem).not.toBeVisible({ timeout: 15000 });
    console.log('Bulk delete successfully uninstalled all selected packages!');

    // 12. Test Navigation Back, Remove/Delete Project from Dashboard, and Re-Import
    console.log('Navigating back to main dashboard...');
    const backBtn = page.locator('.lucide-arrow-left').locator('..');
    await backBtn.first().click();

    await expect(page.getByRole('heading', { name: 'Project Manager' })).toBeVisible();

    // Remove the project from workspace list
    console.log('Removing the project workspace from PEEAK...');
    const removeProjectBtn = page.locator('button[title="Remove project from PEEAK"]').first();
    await expect(removeProjectBtn).toBeVisible();
    await removeProjectBtn.click();

    // Verify project is no longer on dashboard list
    await expect(page.locator('h3:has-text("test-project-full")').first()).not.toBeVisible();

    // Re-import the project
    console.log('Re-importing the project using Import Project button...');
    const importBtn = page.getByRole('button', { name: 'Import Project' });
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Verify it navigates to Details view and detects everything correctly
    console.log('Verifying successful re-import...');
    await expect(page.locator('text=Project Details')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('h3:has-text("test-project-full")').first()).toBeVisible();

    console.log('E2E Full Flow Test Passed Successfully!');

  } finally {
    // Clean up
    if (browser) await browser.close();
    if (tauriProcess) tauriProcess.kill('SIGINT');
  }
});
