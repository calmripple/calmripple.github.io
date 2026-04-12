<!--
🧪 【中文注释】
  工具名称: 静态页面自动化
  功能分类: 测试辅助
  功能说明: 用于自动化操作本地静态 HTML 文件，支持文件交互和页面测试。通过 Playwright 实现自动化访问和操作。
  使用方式: 在 VS Code 中运行该 Python 脚本，或在 Copilot Chat 中请求“自动化测试本地 HTML 文件”。
  关键标签: 静态页面、自动化操作、测试
-->

from playwright.sync_api import sync_playwright
import os

# Example: Automating interaction with static HTML files using file:// URLs

html_file_path = os.path.abspath('path/to/your/file.html')
file_url = f'file://{html_file_path}'

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Navigate to local HTML file
    page.goto(file_url)

    # Take screenshot
    page.screenshot(path='/mnt/user-data/outputs/static_page.png', full_page=True)

    # Interact with elements
    page.click('text=Click Me')
    page.fill('#name', 'John Doe')
    page.fill('#email', 'john@example.com')

    # Submit form
    page.click('button[type="submit"]')
    page.wait_for_timeout(500)

    # Take final screenshot
    page.screenshot(path='/mnt/user-data/outputs/after_submit.png', full_page=True)

    browser.close()

print("Static HTML automation completed!")