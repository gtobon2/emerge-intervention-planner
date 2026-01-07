import { chromium } from '@playwright/test';

async function testImport() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('🧪 Testing Wilson Data Import with Updated Database\n');

  // Wait for DB init
  page.on('console', msg => {
    if (msg.text().includes('DB') || msg.text().includes('Database') || msg.text().includes('Import')) {
      console.log(`  [LOG] ${msg.text().substring(0, 100)}`);
    }
  });

  try {
    await page.goto('http://localhost:3000/settings/wilson-data', { waitUntil: 'domcontentloaded' });

    // Wait for DB to initialize
    console.log('Waiting for database initialization...');
    await page.waitForSelector('button:has-text("Import")', { timeout: 30000 });
    console.log('✅ Page loaded\n');

    // Get initial stats
    const initialStats = await page.textContent('body');
    console.log('Initial state:', initialStats?.includes('No data loaded') ? 'No data loaded' : 'Data exists');

    // Click import button
    console.log('\nClicking Import button...');
    const importBtn = page.locator('button:has-text("Import Wilson Data"), button:has-text("Re-import")');
    await importBtn.click();

    // Wait for import to complete
    await page.waitForTimeout(5000);

    // Check results
    const bodyText = await page.textContent('body') || '';

    // Extract stats
    const statsMatch = bodyText.match(/(\d+) substeps loaded with ([\d,]+) words, ([\d,]+) sentences, (\d+) stories/);
    if (statsMatch) {
      console.log('\n✅ Import Successful!');
      console.log(`   Substeps: ${statsMatch[1]}`);
      console.log(`   Words: ${statsMatch[2]}`);
      console.log(`   Sentences: ${statsMatch[3]}`);
      console.log(`   Stories: ${statsMatch[4]}`);
    } else {
      console.log('\n⚠️ Could not find stats in page');
    }

    // Check success message
    if (bodyText.includes('Imported') && bodyText.includes('successfully')) {
      console.log('\n✅ Success message displayed');
    }

    // Screenshot
    await page.screenshot({ path: 'wilson-import-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: wilson-import-test.png');

    // Test a specific substep
    console.log('\n--- Testing Substep Data ---');
    const select = page.locator('select').first();
    await select.selectOption('1.3');
    await page.waitForTimeout(1000);

    // Check word count for 1.3
    await page.locator('button:has-text("Real Words")').click();
    await page.waitForTimeout(500);

    const summaryText = await page.locator('text=/Substep.*Data Summary/').textContent();
    console.log(`Substep 1.3: ${summaryText}`);

  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
    await page.screenshot({ path: 'wilson-import-error.png', fullPage: true });
  }

  await browser.close();
  console.log('\n✅ Test complete');
}

testImport();
