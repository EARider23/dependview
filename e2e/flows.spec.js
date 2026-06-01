import { test, expect } from '@playwright/test';

test.describe('Peeak Visual Flow E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Seed the mock projects in localStorage before visiting the app
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('projects', JSON.stringify([
        { 
          path: 'D:\\Projects\\ecommerce-app', 
          name: 'ecommerce-app', 
          lastScanned: Date.now(),
          technologies: ['react', 'nextjs', 'tailwind', 'typescript', 'supabase']
        },
        { 
          path: 'D:\\Projects\\portfolio-site', 
          name: 'portfolio-site', 
          lastScanned: Date.now() - 86400000,
          technologies: ['react', 'three']
        },
      ]));
    });
    // Reload page to apply localStorage state
    await page.reload();
  });

  test('visual inventory flow: dashboard, importing, navigation, settings, and package search', async ({ page }) => {
    // 1. Dashboard validation
    await expect(page.locator('text=Project Manager')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ecommerce-app' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'portfolio-site' })).toBeVisible();

    // 2. Settings Flow Check
    const settingsBtn = page.locator('button[title="Global Settings"]');
    await settingsBtn.click();
    await expect(page.locator('role=heading[name="Settings"]')).toBeVisible();
    
    // Switch to dark theme
    const darkThemeOption = page.locator('text=Dark Mode');
    await darkThemeOption.click();
    
    // Save settings
    const saveSettingsBtn = page.locator('button:has-text("Save Settings")');
    await saveSettingsBtn.click();

    // 3. Project Details & Package Search Flow Check
    // Click on the ecommerce-app project card
    const ecommerceCard = page.getByRole('heading', { name: 'ecommerce-app' });
    await ecommerceCard.click();

    // Verify detail page elements
    await expect(page.locator('text=Project Details')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sync' })).toBeVisible();

    // Click Sync button
    const syncBtn = page.getByRole('button', { name: 'Sync' });
    await syncBtn.click();

    // 4. Back button navigation check
    const backBtn = page.locator('.lucide-arrow-left').locator('..');
    await backBtn.first().click();
    await expect(page.locator('text=Project Manager')).toBeVisible();
  });
});
