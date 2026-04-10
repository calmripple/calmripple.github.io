const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, 'test-output.txt');

async function main() {
  fs.writeFileSync(outFile, 'Starting test...\n');
  
  const browser = await chromium.launch();
  fs.appendFileSync(outFile, 'Browser launched\n');
  
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Navigate to JavaScript section
  const jsUrl = 'http://localhost:5173/%E7%AC%94%E8%AE%B0/%F0%9F%8C%90%20%E5%A4%A7%E5%89%8D%E7%AB%AF/JavaScript/';
  await page.goto(jsUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const title = await page.title();
  fs.appendFileSync(outFile, 'Page title: ' + title + '\n');
  
  // Find sidebar article links
  const sidebarLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.VPSidebar a'))
      .map(a => ({ href: a.href, text: a.textContent.trim().slice(0, 50) }))
      .slice(0, 5);
  });
  fs.appendFileSync(outFile, 'Sidebar links: ' + JSON.stringify(sidebarLinks, null, 2) + '\n');
  
  // Click on the first sidebar link
  if (sidebarLinks.length > 0) {
    const firstLink = sidebarLinks[0].href;
    fs.appendFileSync(outFile, 'Navigating to: ' + firstLink + '\n');
    await page.goto(firstLink, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const newTitle = await page.title();
    fs.appendFileSync(outFile, 'New page title: ' + newTitle + '\n');
    
    // Check for sidebar-articles
    const sidebarCount = await page.locator('.sidebar-articles').count();
    fs.appendFileSync(outFile, 'sidebar-articles count: ' + sidebarCount + '\n');
    
    if (sidebarCount > 0) {
      const text = await page.locator('.sidebar-articles').textContent();
      fs.appendFileSync(outFile, 'Sidebar content: ' + text.slice(0, 800) + '\n');
      
      // Check for numbering
      const numCount = await page.locator('.sidebar-articles__num').count();
      fs.appendFileSync(outFile, 'Number elements: ' + numCount + '\n');
      
      // Check for header
      const headerCount = await page.locator('.sidebar-articles__header').count();
      fs.appendFileSync(outFile, 'Header elements: ' + headerCount + '\n');
      
      // Check for dates
      const dateCount = await page.locator('.sidebar-articles__date').count();
      fs.appendFileSync(outFile, 'Date elements: ' + dateCount + '\n');
      
      // Check for change button
      const btnCount = await page.locator('.sidebar-articles__change-btn').count();
      fs.appendFileSync(outFile, 'Change button: ' + btnCount + '\n');
      
      // Take component screenshot
      await page.locator('.sidebar-articles').screenshot({ path: path.join(__dirname, 'sidebar-component.png') });
      fs.appendFileSync(outFile, 'Component screenshot saved\n');
    }
    
    // Take full page screenshot
    await page.screenshot({ path: path.join(__dirname, 'sidebar-full.png') });
    fs.appendFileSync(outFile, 'Full page screenshot saved\n');
  }
  
  await browser.close();
  fs.appendFileSync(outFile, 'Done!\n');
}

main().catch(e => {
  fs.writeFileSync(outFile, 'ERROR: ' + e.message + '\n' + e.stack);
  process.exit(1);
});
