const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, 'test-output3.txt');

async function main() {
  const log = [];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const url = 'http://localhost:5173/%E7%AC%94%E8%AE%B0/%F0%9F%8C%90%20%E5%A4%A7%E5%89%8D%E7%AB%AF/JavaScript/apply.html';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Get the current route path from VitePress
  const routeInfo = await page.evaluate(() => {
    return {
      locationPathname: window.location.pathname,
      locationHref: window.location.href,
    };
  });
  log.push('Location pathname: ' + routeInfo.locationPathname);
  log.push('Location href: ' + routeInfo.locationHref);

  // Get all sidebar link hrefs
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.sidebar-articles__link'))
      .map(a => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim().slice(0, 50),
        isActive: a.classList.contains('is-active'),
      }));
  });
  log.push('All sidebar links (' + allLinks.length + '):');
  allLinks.forEach(l => log.push('  ' + (l.isActive ? '[ACTIVE] ' : '') + l.href + ' => ' + l.text));

  // Check total items count by looking at change button behavior
  // First get all items by clicking through pages
  let allItems = [];
  let pageNum = 1;
  
  const getItems = async () => {
    return page.evaluate(() => {
      const nums = Array.from(document.querySelectorAll('.sidebar-articles__num'));
      const links = Array.from(document.querySelectorAll('.sidebar-articles__link'));
      return nums.map((n, i) => ({
        num: n.textContent.trim(),
        text: links[i] ? links[i].textContent.trim().slice(0, 40) : '',
        href: links[i] ? links[i].getAttribute('href') : '',
        isActive: links[i] ? links[i].classList.contains('is-active') : false,
      }));
    });
  };

  // Collect items from all pages
  const firstPageItems = await getItems();
  allItems.push(...firstPageItems);
  log.push('Page 1: items ' + firstPageItems.map(i => i.num).join(','));
  
  const btn = page.locator('.sidebar-articles__change-btn');
  const hasBtn = await btn.count() > 0;
  
  if (hasBtn) {
    for (let i = 0; i < 5; i++) {
      await btn.click();
      await page.waitForTimeout(300);
      const items = await getItems();
      // Check if we're back to page 1
      if (items[0] && items[0].num === firstPageItems[0].num) break;
      allItems.push(...items);
      log.push('Page ' + (i + 2) + ': items ' + items.map(it => it.num).join(','));
    }
  }

  log.push('Total items across all pages: ' + allItems.length);
  
  // Find which item should be active (matches apply.html)
  const matching = allItems.filter(item => item.href && decodeURIComponent(item.href).includes('apply'));
  log.push('Items matching "apply": ' + JSON.stringify(matching));

  fs.writeFileSync(outFile, log.join('\n'));
  await browser.close();
}

main().catch(e => {
  fs.writeFileSync(outFile, 'ERROR: ' + e.message + '\n' + e.stack);
  process.exit(1);
});
