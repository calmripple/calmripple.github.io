<!--
🧪 【中文注释】
  工具名称: 控制台日志捕获
  功能分类: 测试辅助
  功能说明: 用于捕获浏览器自动化过程中的控制台日志，便于调试和分析页面行为。通过 Playwright 自动收集日志信息。
  使用方式: 在 VS Code 中运行该 Python 脚本，或在 Copilot Chat 中请求“捕获页面控制台日志”。
  关键标签: 日志分析、自动化测试、调试
-->

from playwright.sync_api import sync_playwright

# Example: Capturing console logs during browser automation

url = 'http://localhost:5173'  # Replace with your URL

console_logs = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # Set up console log capture
    def handle_console_message(msg):
        console_logs.append(f"[{msg.type}] {msg.text}")
        print(f"Console: [{msg.type}] {msg.text}")

    page.on("console", handle_console_message)

    # Navigate to page
    page.goto(url)
    page.wait_for_load_state('networkidle')

    # Interact with the page (triggers console logs)
    page.click('text=Dashboard')
    page.wait_for_timeout(1000)

    browser.close()

# Save console logs to file
with open('/mnt/user-data/outputs/console.log', 'w') as f:
    f.write('\n'.join(console_logs))

print(f"\nCaptured {len(console_logs)} console messages")
print(f"Logs saved to: /mnt/user-data/outputs/console.log")