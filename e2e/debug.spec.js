import { test, chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';

test('debug CDP connection', async () => {
  // Start tauri dev server
  const tauriProcess = spawn('npm', ['run', 'tauri', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: '--remote-debugging-port=9222 --disable-shared-workers --disable-service-workers'
    },
    shell: true
  });

  tauriProcess.stdout.on('data', (data) => console.log(`[Tauri Output] ${data}`));
  tauriProcess.stderr.on('data', (data) => console.error(`[Tauri Error] ${data}`));

  // Wait for remote debugging port
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        ready = true;
        break;
      }
    } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  if (!ready) {
    tauriProcess.kill('SIGINT');
    throw new Error('Tauri did not start.');
  }

  try {
    const response = await fetch('http://127.0.0.1:9222/json');
    const targets = await response.json();
    const pageTarget = targets.find(t => t.type === 'page' && (t.url.includes('5173') || t.url.includes('tauri')));
    
    if (!pageTarget) {
      console.log('All targets:', targets);
      throw new Error('No page target found');
    }

    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    const browserWsUrl = versionData.webSocketDebuggerUrl;
    console.log('Connecting to browser ws url:', browserWsUrl);
    const browser = await chromium.connectOverCDP(browserWsUrl);
    
    console.log('Contexts count:', browser.contexts().length);
    for (let i = 0; i < browser.contexts().length; i++) {
      const ctx = browser.contexts()[i];
      console.log(`Context ${i} pages count:`, ctx.pages().length);
      ctx.pages().forEach((p, idx) => {
        console.log(`  Page ${idx} URL:`, p.url());
      });
    }

    await browser.close();
  } finally {
    tauriProcess.kill('SIGINT');
  }
});

