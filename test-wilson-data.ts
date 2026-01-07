import { chromium } from '@playwright/test';

async function testWilsonDataPage() {
  // Run with visible browser to see what's happening
  const browser = await chromium.launch({
    headless: false,  // Show browser window
    slowMo: 100,      // Slow down actions to see them
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const issues: { type: string; description: string; severity: 'bug' | 'warning' | 'info' }[] = [];
  const consoleMessages: string[] = [];

  // Capture ALL console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`  [CONSOLE ${msg.type()}] ${text.substring(0, 150)}`);
  });

  // Capture page errors
  page.on('pageerror', error => {
    issues.push({
      type: 'Page Error',
      description: error.message.substring(0, 200),
      severity: 'bug'
    });
    console.log(`  [PAGE ERROR] ${error.message}`);
  });

  console.log('🧪 Starting Wilson Data Page Tests...\n');

  try {
    // Test 1: Navigate to page
    console.log('Test 1: Navigate to Wilson Data page...');
    await page.goto('http://localhost:3000/settings/wilson-data', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for initialization - up to 30 seconds
    console.log('  Waiting for database initialization...');

    let initialized = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);

      // Check if we've moved past the initialization screen
      const bodyText = await page.textContent('body') || '';
      if (!bodyText.includes('Initializing database')) {
        initialized = true;
        console.log(`  ✅ Database initialized after ${i + 1} seconds`);
        break;
      }
      console.log(`  ⏳ Still initializing... (${i + 1}s)`);
    }

    if (!initialized) {
      issues.push({
        type: 'Performance/Bug',
        description: 'Database initialization took more than 30 seconds - possible hang',
        severity: 'bug'
      });
      console.log('  ❌ Database initialization timeout after 30 seconds');
    }

    // Take screenshot
    await page.screenshot({ path: 'wilson-data-loaded.png', fullPage: true });

    // Test 2: Check for key UI elements
    console.log('\nTest 2: Checking UI elements...');

    const checks = [
      { name: 'Page title', selector: 'h1:has-text("Wilson")' },
      { name: 'Import button', selector: 'button:has-text("Import")' },
      { name: 'Substep selector', selector: 'select' },
      { name: 'Tabs', selector: 'button:has-text("Sounds")' },
      { name: 'Save button', selector: 'button:has-text("Save")' },
    ];

    for (const { name, selector } of checks) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`  ✅ ${name}: found`);
      } else {
        console.log(`  ❌ ${name}: not found`);
        issues.push({
          type: 'UI Element Missing',
          description: `${name} not found (${selector})`,
          severity: 'warning'
        });
      }
    }

    // Test 3: Test Import functionality
    console.log('\nTest 3: Testing Import...');
    const importBtn = page.locator('button:has-text("Import Wilson Data"), button:has-text("Re-import")');
    if (await importBtn.count() > 0) {
      console.log('  Clicking import button...');
      await importBtn.click();

      // Wait for import to complete
      await page.waitForTimeout(5000);

      // Check for success message
      const bodyText = await page.textContent('body') || '';
      if (bodyText.includes('substeps loaded') || bodyText.includes('Imported')) {
        console.log('  ✅ Import successful');
      } else {
        console.log('  ⚠️ Import may not have completed - check manually');
      }

      await page.screenshot({ path: 'wilson-data-after-import.png', fullPage: true });
    }

    // Test 4: Test tab switching
    console.log('\nTest 4: Testing tab switching...');
    const tabs = ['Sounds', 'Real Words', 'Nonsense Words', 'HF Words', 'Sentences'];
    for (const tabName of tabs) {
      const tab = page.locator(`button:has-text("${tabName}")`);
      if (await tab.count() > 0) {
        await tab.click();
        await page.waitForTimeout(500);
        console.log(`  ✅ ${tabName} tab clickable`);
      }
    }

    // Test 5: Test substep switching
    console.log('\nTest 5: Testing substep selector...');
    const select = page.locator('select').first();
    if (await select.count() > 0) {
      await select.selectOption('1.3');
      await page.waitForTimeout(1000);
      console.log('  ✅ Changed substep to 1.3');

      await select.selectOption('2.1');
      await page.waitForTimeout(1000);
      console.log('  ✅ Changed substep to 2.1');
    }

    // Test 6: Check data display
    console.log('\nTest 6: Checking data display...');
    await page.locator('button:has-text("Real Words")').first().click();
    await page.waitForTimeout(500);

    const wordCount = await page.locator('.flex.flex-wrap.gap-2 > div').count();
    console.log(`  Words displayed: ${wordCount}`);

    // Final screenshot
    await page.screenshot({ path: 'wilson-data-final.png', fullPage: true });

    // Wait a moment before closing
    console.log('\n📸 Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    issues.push({
      type: 'Test Error',
      description: String(error).substring(0, 300),
      severity: 'bug'
    });
    console.log(`\n❌ Test error: ${error}`);
    await page.screenshot({ path: 'wilson-data-error.png', fullPage: true });
  }

  await browser.close();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));

  const bugs = issues.filter(i => i.severity === 'bug');
  const warnings = issues.filter(i => i.severity === 'warning');

  if (bugs.length === 0 && warnings.length === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    if (bugs.length > 0) {
      console.log(`\n🔴 BUGS (${bugs.length}):`);
      bugs.forEach((b, i) => console.log(`  ${i + 1}. [${b.type}] ${b.description}`));
    }
    if (warnings.length > 0) {
      console.log(`\n🟡 WARNINGS (${warnings.length}):`);
      warnings.forEach((w, i) => console.log(`  ${i + 1}. [${w.type}] ${w.description}`));
    }
  }

  console.log('\n' + '='.repeat(60));
}

testWilsonDataPage();
