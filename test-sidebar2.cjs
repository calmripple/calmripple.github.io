const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, 'test-output2.txt');

async function main() {
  const log = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const url = 'http://localhost:5173/%E7%AC%94%E8%AE%B0/%F0%9F%8C%90%20%E5%A4%A7%E5%89%8D%E7%AB%AF/JavaScript/apply.html';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Test active state
  const activeCount = await page.locator('.sidebar-articles__link.is-active').count();
  log.push('Active links: ' + activeCount);
  if (activeCount > 0) {
    const activeText = await page.locator('.sidebar-articles__link.is-active').textContent();
    log.push('Active text: ' + activeText.trim().slice(0, 50));
  }

  // Test pagination
  const btnExists = await page.locator('.sidebar-articles__change-btn').count();
  log.push('Change btn exists: ' + btnExists);

  if (btnExists > 0) {
    const itemsBefore = await page.locator('.sidebar-articles__num').allTextContents();
    log.push('Numbers before click: ' + itemsBefore.join(', '));

    await page.locator('.sidebar-articles__change-btn').click();
    await page.waitForTimeout(500);

    const itemsAfter = await page.locator('.sidebar-articles__num').allTextContents();
    log.push('Numbers after click: ' + itemsAfter.join(', '));

    await page.locator('.sidebar-articles').screenshot({ path: path.join(__dirname, 'sidebar-page2.png') });
    log.push('Page 2 screenshot saved');
  }

  // Navigate to a different article to test active state change
  const links = await page.locator('.sidebar-articles__link').all();
  log.push('Total sidebar links: ' + links.length);

  if (links.length > 1) {
    const secondLink = await links[1].textContent();
    log.push('Clicking on: ' + secondLink.trim().slice(0, 50));
    await links[1].click();
    await page.waitForTimeout(2000);

    const newActive = await page.locator('.sidebar-articles__link.is-active').count();
    log.push('New active count: ' + newActive);
    if (newActive > 0) {
      const newActiveText = await page.locator('.sidebar-articles__link.is-active').textContent();
      log.push('New active text: ' + newActiveText.trim().slice(0, 50));
    }
    await page.locator('.sidebar-articles').screenshot({ path: path.join(__dirname, 'sidebar-active.png') });
    log.push('Active state screenshot saved');
  }

  fs.writeFileSync(outFile, log.join('\n'));
  await browser.close();
}

main().catch(e => {
  fs.writeFileSync(outFile, 'ERROR: ' + e.message + '\n' + e.stack);
  process.exit(1);
});
