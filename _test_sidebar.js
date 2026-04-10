const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));
  await page.goto('http://localhost:5174/%E7%AC%94%E8%AE%B0/%F0%9F%8C%90%20%E5%A4%A7%E5%89%8D%E7%AB%AF/CSS/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  const count = await page.locator('.sidebar-articles').count();
  const items = await page.locator('.sidebar-articles__item').count();
  const toc = await page.locator('.auto-toc').count();
  process.stdout.write('RESULT:' + JSON.stringify({ count, items, toc, errors }) + '\n');
  await browser.close();
  process.exit(0);
})().catch(e => { process.stdout.write('ERR:' + e.message + '\n'); process.exit(1); });
