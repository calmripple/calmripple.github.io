const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, 'test-final.txt');

async function main() {
  const log = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Navigate to an article with a date that's on page 1
  const url = 'http://localhost:5173/%E7%AC%94%E8%AE%B0/%F0%9F%8C%90%20%E5%A4%A7%E5%89%8D%E7%AB%AF/JavaScript/es6+.html';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Check active state
  const activeCount = await page.locator('.sidebar-articles__link.is-active').count();
  log.push('Active links: ' + activeCount);
  if (activeCount > 0) {
    const activeText = await page.locator('.sidebar-articles__link.is-active').textContent();
    log.push('Active text: ' + activeText.trim());
  }

  // Get current page numbers
  const nums = await page.locator('.sidebar-articles__num').allTextContents();
  log.push('Current page numbers: ' + nums.join(', '));

  // Screenshot the sidebar component
  await page.locator('.sidebar-articles').screenshot({ path: path.join(__dirname, 'sidebar-final.png') });
  log.push('Final sidebar screenshot saved');

  // Full page screenshot
  await page.screenshot({ path: path.join(__dirname, 'sidebar-final-full.png') });
  log.push('Final full page screenshot saved');

  fs.writeFileSync(outFile, log.join('\n'));
  await browser.close();
}

main().catch(e => {
  fs.writeFileSync(outFile, 'ERROR: ' + e.message + '\n' + e.stack);
  process.exit(1);
});
