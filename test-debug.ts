import { chromium } from '@playwright/test';

async function debugTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];

  // Track all failed network requests
  page.on('requestfailed', request => {
    failedRequests.push(`${request.failure()?.errorText}: ${request.url()}`);
  });

  // Track response errors (404s, 500s, etc.)
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
    // Also log DB init messages
    if (msg.text().includes('DB') || msg.text().includes('Database')) {
      console.log(`[DB LOG] ${msg.text()}`);
    }
  });

  console.log('🔍 Debug Test - Checking for 404 errors and DB initialization\n');

  await page.goto('http://localhost:3000/settings/wilson-data', {
    waitUntil: 'domcontentloaded',
    timeout: 10000
  });

  // Wait a bit
  await page.waitForTimeout(5000);

  console.log('\n📋 Failed Requests (404s, etc.):');
  if (failedRequests.length === 0) {
    console.log('  None');
  } else {
    failedRequests.forEach(r => console.log(`  - ${r}`));
  }

  console.log('\n📋 Console Errors:');
  if (consoleErrors.length === 0) {
    console.log('  None');
  } else {
    consoleErrors.slice(0, 10).forEach(e => console.log(`  - ${e.substring(0, 100)}`));
  }

  // Check if IndexedDB is available
  const idbAvailable = await page.evaluate(() => {
    return typeof indexedDB !== 'undefined';
  });
  console.log(`\n📋 IndexedDB available: ${idbAvailable}`);

  // Try to check Dexie directly
  const dbStatus = await page.evaluate(async () => {
    try {
      // Check if we can access indexedDB
      const dbs = await indexedDB.databases();
      return { available: true, databases: dbs.map(d => d.name) };
    } catch (e) {
      return { available: false, error: String(e) };
    }
  });
  console.log(`📋 IndexedDB databases: ${JSON.stringify(dbStatus)}`);

  await browser.close();
}

debugTest();
