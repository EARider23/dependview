import { test, expect, chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

test('live tauri app E2E flow testing over CDP', async () => {
  // 1. Programmatically launch the Tauri dev app with debugging enabled
  const tauriProcess = spawn('npm', ['run', 'tauri', 'dev'], {
    cwd: path.resolve(__dirname, '..'), // Run from the 'deped' directory
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9222'
    },
    shell: true
  });

  // Log process output to console for easier debugging
  tauriProcess.stdout.on('data', (data) => console.log(`[Tauri Output] ${data}`));
  tauriProcess.stderr.on('data', (data) => console.error(`[Tauri Error] ${data}`));

  // 2. Poll the remote debugging port until it is open (up to 90 seconds)
  let ready = false;
  console.log('Waiting for Tauri WebView2 remote debugging port 9222 to start...');
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        ready = true;
        console.log('Tauri WebView2 remote debugging port is ready!');
        break;
      }
    } catch (e) {
      // Wait and retry
    }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  if (!ready) {
    tauriProcess.kill('SIGINT');
    throw new Error('Tauri WebView2 debugging port 9222 did not open after 90 seconds.');
  }

  let browser;
  try {
    // 3. Connect to the running WebView2 instance
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];

    await page.bringToFront();

    // 4. Wait for React app to mount and render the main header (with higher timeout for compilation)
    console.log('Waiting for Peeak application to load...');
    await expect(page.locator('text=PEEAK')).toBeVisible({ timeout: 30000 });

    // Verify Project Manager title (using getByRole to avoid text element splits)
    await expect(page.getByRole('heading', { name: 'Project Manager' })).toBeVisible({ timeout: 10000 });

    // 5. Open Settings
    const settingsBtn = page.locator('button[title="Global Settings"]');
    await expect(settingsBtn).toBeVisible();
    await settingsBtn.click();
    await expect(page.locator('text=Appearance')).toBeVisible();

    // Toggle Dark Mode and Save
    await page.locator('text=Dark Mode').click();
    await page.locator('button:has-text("Save Settings")').click();

    // 6. Test Project Detail interactions if a card is visible
    const projectCard = page.locator('h3.tracking-tight').first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await expect(page.locator('text=Project Details')).toBeVisible();

      // Trigger actual sync with backend
      const syncBtn = page.getByRole('button', { name: 'Sync' });
      await expect(syncBtn).toBeVisible();
      await syncBtn.click();

      // Navigate back
      await page.locator('.lucide-arrow-left').locator('..').first().click();
      await expect(page.getByRole('heading', { name: 'Project Manager' })).toBeVisible();
    }
  } finally {
    // 7. Clean up: close connection and terminate the Tauri process
    if (browser) await browser.close();
    tauriProcess.kill('SIGINT');
  }
});
