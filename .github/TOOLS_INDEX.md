# 🛠️ Copilot 工具索引

> 由 AI 自动整理分类，包含本仓库所有已安装的 GitHub Copilot 工具。
> 使用 GitHub Copilot Chat 或 VS Code 中的 Copilot 功能调用这些工具。

---

## 📋 编码规范

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`中文回复规范`](.github/instructions/chinese-response.instructions.md) | 指令 | 用于强制所有 Copilot 回复均为中文，确保交互内容中文化。 | 自动应用，无需手动调用，所有 Copilot 回复均为中文。 |
| [`通用编码规范`](.github/instructions/general-coding.instructions.md) | 指令 | 用于规范代码风格，强调清晰命名、单一职责、错误处理和代码复用。 | 自动应用于所有代码编辑和审查，无需手动调用。 |
| [`Markdown规范`](.github/instructions/markdown.instructions.md) | 指令 | 帮助规范 Markdown 文件格式，确保符合 CommonMark 标准。适用于撰写和审查 `.md` 文件。 | 在 VS Code 编辑 `.md` 文件时自动应用；GitHub PR/提交时自动检查。 |
| [`JS编码规范`](.github/instructions/nodejs-javascript-vitest.instructions.md) | 指令 | 用于规范 Node.js 和 JavaScript 代码编写，包含 Vitest 测试相关最佳实践。 | 在 VS Code 编辑 `.js`、`.mjs`、`.cjs` 文件时自动应用；GitHub PR/提交时自动检查。 |
| [`规范化提交`](.github/skills/conventional-commit/SKILL.md) | 提示词 | 用于生成符合 Conventional Commits 规范的结构化提交信息，指导标准化提交流程。 | 在 VS Code 的 Copilot Chat 输入“生成规范提交信息”或在 GitHub 提交时调用该工具。 |
| [`智能提交`](.github/skills/git-commit/SKILL.md) | 提示词 | 帮助智能生成规范化 Git 提交信息，支持自动检测变更类型和交互式提交。 | 在 VS Code 输入“/commit”或“生成Git提交”，自动触发该工具。 |
| [`高端前端规范`](.github/skills/premium-frontend-ui/SKILL.md) | 提示词 | 指导打造高端前端 UI，包括动效、排版和架构最佳实践。 | 在 VS Code 中通过 Copilot Chat 输入前端开发需求自动调用。 |
| [`提示词构建器`](.github/skills/prompt-builder/SKILL.md) | 提示词 | 指导用户构建高质量 Copilot 提示词，规范结构和最佳实践。 | 在 VS Code 中通过 Copilot Chat 输入提示词构建需求自动调用。 |
| [`HTML规范参考`](.github/skills/web-coder/references/html-markup.md) | 提示词 | 帮助规范 HTML5 和标记语言的文档结构，提供元素使用最佳实践。 | 在 VS Code 中查阅 Copilot 提示或输入“HTML规范”相关问题自动触发。 |
| [`JS编程规范`](.github/skills/web-coder/references/javascript-programming.md) | 提示词 | 帮助规范 JavaScript 编程风格，介绍现代 JS 模式和核心概念。 | 在 VS Code 中输入 JS 相关问题或请求编码规范时自动触发。 |
| [`媒体图像规范`](.github/skills/web-coder/references/media-graphics.md) | 提示词 | 用于规范网页多媒体内容和图片格式的使用，提供最佳实践。 | 在 VS Code 中查阅图片或多媒体相关规范时自动触发。 |
| [`Web API规范`](.github/skills/web-coder/references/web-apis-dom.md) | 提示词 | 帮助规范 Web API 和 DOM 的使用，介绍结构和操作方式。 | 在 VS Code 中输入 DOM 或 Web API 相关问题时自动触发。 |
| [`协议标准参考`](.github/skills/web-coder/references/web-protocols-standards.md) | 提示词 | 用于规范网页协议和标准，介绍主要组织和规范内容。 | 在 VS Code 中查阅协议或标准相关内容时自动触发。 |
| [`HTTP网络规范`](.github/skills/web-coder/references/http-networking.md) | 提示词 | 帮助规范 HTTP 协议和网络通信，提供版本和核心概念参考。 | 在 VS Code 中查阅 HTTP 或网络相关问题时自动触发。 |

## 🔍 代码审查

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`代码审查员`](.github/agents/code-reviewer.md) | Agent | 帮助进行代码审查，关注正确性、安全性和可维护性，查找缺陷和安全风险。 | 在 Copilot Chat 中选择“Code Reviewer”Agent，提交代码片段或 PR 进行审查。 |
| [`通用代码审查`](.github/instructions/code-review-generic.instructions.md) | 指令 | 提供通用代码审查指令，适用于任何项目，规范审查流程。 | 自动应用于 Copilot 代码审查流程，无需手动调用。 |
| [`代码审查规范`](.github/instructions/code-review.instructions.md) | 指令 | 用于代码审查，关注正确性、安全、错误处理和性能等方面。 | 自动应用于 Copilot 代码审查流程，无需手动调用。 |
| [`代码解释助手`](.github/prompts/explain.prompt.md) | 提示词 | 用于解释选中代码的功能、逻辑及注意事项，便于理解和审查。 | 在 VS Code 选中代码后右键选择“Copilot: Explain Code”；GitHub PR 评论中可调用。 |
| [`文档审查助手`](.github/prompts/review-article.prompt.md) | 提示词 | 用于审查文档文章，检查写作风格、规范和内容质量。 | 在 VS Code 选中文档后右键选择“Copilot: Review Article”；GitHub PR 评论中可调用。 |
| [`博客审查助手`](.github/prompts/review-blog.prompt.md) | 提示词 | 帮助审查技术博客，提升内容清晰度、简洁性和规范性。 | 在 VS Code 选中博客内容后右键选择“Copilot: Review Blog”；GitHub PR 评论中可调用。 |
| [`三层审查`](.github/skills/doublecheck/SKILL.md) | 提示词 | 用于对 AI 生成内容进行三层验证，提取可验证声明并生成结构化审查报告。 | 在 Copilot Chat 输入“审查AI输出”或“生成验证报告”，自动调用该工具。 |
| [`验证报告模板`](.github/skills/doublecheck/assets/verification-report-template.md) | 提示词 | 用于生成结构化验证报告模板，便于人工审查和结果归档。 | 在 Copilot Chat 或审查流程中自动插入验证报告模板。 |
| [`网页设计审查`](.github/skills/web-design-reviewer/SKILL.md) | 提示词 | 用于审查网站设计，检测并修复响应式、可访问性及布局问题。 | 在 VS Code 中输入“审查网页设计”或“检查UI”自动触发。 |
| [`视觉检查清单`](.github/skills/web-design-reviewer/references/visual-checklist.md) | 提示词 | 帮助进行网页视觉检查，提供详细的设计审查清单。 | 在 VS Code 中查阅网页设计审查清单时自动触发。 |

## ♻️ 代码重构

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`性能优化助手`](.github/instructions/performance-optimization.instructions.md) | 指令 | 提供各类代码性能优化建议，涵盖前端、后端及数据库，支持故障排查和优化。 | 在 VS Code 选中代码后可调用 Copilot Refactor；GitHub PR/提交时自动建议优化。 |
| [`代码重构助手`](.github/prompts/refactor.prompt.md) | 提示词 | 分析代码并提出重构建议，优化结构，消除代码异味，提升可维护性。 | 在 VS Code 选中代码后右键选择“Copilot: Refactor”；GitHub PR 评论中可调用。 |
| [`代码重构助手`](.github/skills/refactor/SKILL.md) | 提示词 | 用于外科式代码重构，提升可维护性并消除代码异味。 | 在 VS Code 中通过 Copilot Chat 输入重构需求自动调用。 |
| [`重构计划制定`](.github/skills/refactor-plan/SKILL.md) | 提示词 | 帮助制定多文件重构计划，合理安排步骤并支持回滚。 | 在 VS Code 中通过 Copilot Chat 输入重构规划需求自动调用。 |
| [`框架修复指南`](.github/skills/web-design-reviewer/references/framework-fixes.md) | 提示词 | 用于针对不同前端框架和样式方法提供布局和样式修复建议。 | 在 VS Code 中遇到布局或样式问题时查阅自动触发。 |
| [`性能优化参考`](.github/skills/web-coder/references/performance-optimization.md) | 提示词 | 用于优化网页性能，提供核心指标和优化建议。 | 在 VS Code 中查阅性能优化相关内容时自动触发。 |

## 🧪 测试辅助

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`Playwright`](.github/agents/playwright-tester.agent.md) | Agent | 帮助生成和分析 Playwright 测试，支持网站探索、测试运行和故障排查。 | 在 Copilot Chat 中选择“Playwright Tester Mode”Agent，输入测试需求或分析测试结果。 |
| [`测试生成器`](.github/prompts/test.prompt.md) | 提示词 | 自动生成全面的单元测试和集成测试，覆盖正常、边界和异常场景。 | 在 VS Code 选中代码后右键选择“Copilot: Generate Tests”；GitHub PR 评论中可调用。 |
| [`网站探索测试`](.github/skills/playwright-explore-website/SKILL.md) | 提示词 | 用于网站探索测试，自动识别并交互核心功能，辅助测试流程。 | 在 VS Code 中通过 Copilot Chat 输入网站测试需求自动调用。 |
| [`自动生成测试`](.github/skills/playwright-generate-test/SKILL.md) | 提示词 | 帮助根据场景生成 Playwright 自动化测试脚本，提升测试效率。 | 在 VS Code 中通过 Copilot Chat 输入测试场景自动调用。 |
| [`Vue Pinia单`](.github/skills/unit-test-vue-pinia/SKILL.md) | 提示词 | 用于编写和审查 Vue 3 + TypeScript + Pinia 项目的单元测试，提供测试模式和断言建议。 | 在 VS Code 中通过 Copilot Chat 或代码片段调用，辅助生成和优化测试代码。 |
| [`Pinia测试模式`](.github/skills/unit-test-vue-pinia/references/pinia-patterns.md) | 提示词 | 提供 Pinia 测试的常用代码片段和模式，便于快速编写和复用测试逻辑。 | 在 VS Code 编辑 Pinia 测试文件时，参考或插入此文档中的代码片段。 |
| [`网页应用测试`](.github/skills/webapp-testing/SKILL.md) | 提示词 | 用于测试本地网页应用，支持功能验证、UI调试和浏览器日志捕获。 | 在 VS Code 中输入“测试网页应用”或运行 Playwright 脚本自动触发。 |
| [`控制台日志捕获`](.github/skills/webapp-testing/examples/console_logging.py) | 提示词 | 用于捕获浏览器自动化过程中的控制台日志，辅助调试。 | 在 VS Code 中运行该 Python 脚本或集成到测试流程中。 |
| [`元素发现助手`](.github/skills/webapp-testing/examples/element_discovery.py) | 提示词 | 帮助自动发现网页上的按钮等元素，便于测试脚本编写。通过 Playwright 自动化浏览器操作，获取页面元素信息。 | 在 VS Code 终端运行 Python 文件，或在 GitHub Actions 中调用此脚本。 |
| [`静态页面自动化`](.github/skills/webapp-testing/examples/static_html_automation.py) | 提示词 | 用于自动化操作本地静态 HTML 文件，模拟用户交互进行测试。通过 Playwright 加载 file:// URL 并执行操作。 | 在 VS Code 终端运行 Python 文件，或在 GitHub Actions 中调用此脚本。 |
| [`服务器测试启动`](.github/skills/webapp-testing/scripts/with_server.py) | 提示词 | 帮助启动一个或多个开发服务器，等待就绪后自动运行测试命令。适用于端到端测试场景。 | 在 VS Code 终端运行：python scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py。 |

## 📝 文档生成

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`文档写作规范`](.github/instructions/docs-writing.instructions.md) | 指令 | 帮助撰写文档，提供文档风格和内容规范，提升文档质量。 | 自动应用于 docs、api、remote 目录下的文档编辑，无需手动调用。 |
| [`Markdown无障`](.github/instructions/markdown-accessibility.instructions.md) | 指令 | 用于审查 Markdown 文件的可访问性，确保文档符合无障碍标准。 | 自动应用于所有 Markdown 文件审查，无需手动调用。 |
| [`Markdown内容`](.github/instructions/markdown-content-creation.instructions.md) | 指令 | 规范 Markdown 内容创作，提供结构和格式标准，适用于博客等文档。 | 自动应用于所有 Markdown 文件编辑，无需手动调用。 |
| [`GFM格式规范`](.github/instructions/markdown-gfm.instructions.md) | 指令 | 用于 GitHub 风格 Markdown 格式化，确保文档符合 GFM 规范。 | 自动应用于所有 Markdown 文件编辑，无需手动调用。 |
| [`文档生成器`](.github/prompts/document.prompt.md) | 提示词 | 帮助生成 API 文档和代码使用示例，提升代码可读性和维护性。 | 在 VS Code 选中代码后右键选择“Copilot: Generate Documentation”；GitHub PR 评论中可调用。 |
| [`文档专家`](.github/skills/documentation-writer/SKILL.md) | 提示词 | 帮助撰写高质量技术文档，遵循 Diátaxis 框架，提升文档结构和表达。 | 在 Copilot Chat 输入“生成技术文档”或“优化文档结构”，自动调用该工具。 |
| [`Markdown转H`](.github/skills/markdown-to-html/SKILL.md) | 提示词 | 将 Markdown 文件转换为 HTML，支持多种转换工具和自定义脚本。 | 在 Copilot Chat 输入“转换Markdown为HTML”或“生成网页”，自动触发该工具。 |
| [`转换示例`](.github/skills/markdown-to-html/references/basic-markdown-to-html.md) | 提示词 | 提供 Markdown 到 HTML 的基本转换示例，便于理解和自定义转换规则。 | 在 Copilot Chat 或开发流程中查阅转换示例，辅助自定义脚本编写。 |
| [`Markdown语法`](.github/skills/markdown-to-html/references/basic-markdown.md) | 提示词 | 提供 Markdown 基础语法参考，帮助规范文档格式和内容编写。 | 在 Copilot Chat 或文档编写时查阅 Markdown 基础语法。 |
| [`代码块转 HTML`](.github/skills/markdown-to-html/references/code-blocks-to-html.md) | 提示词 | 帮助将 Markdown 代码块转换为 HTML 格式，便于网页展示。 | 在 VS Code 中编辑 Markdown 文件，使用该工具自动生成对应 HTML 代码片段。 |
| [`代码块生成`](.github/skills/markdown-to-html/references/code-blocks.md) | 提示词 | 用于创建和高亮 Markdown 代码块，提升代码展示效果。 | 在 VS Code 中输入三反引号包裹代码，工具自动识别并高亮显示。 |
| [`折叠区转 HTML`](.github/skills/markdown-to-html/references/collapsed-sections-to-html.md) | 提示词 | 帮助将 Markdown 折叠区域转换为 HTML，便于信息分层展示。 | 在 VS Code 中编辑 Markdown，工具自动生成对应 HTML 折叠区域。 |
| [`折叠区生成`](.github/skills/markdown-to-html/references/collapsed-sections.md) | 提示词 | 用于在 Markdown 中创建折叠区域，优化信息组织结构。 | 在 VS Code 中插入 <details> 标签，工具辅助生成折叠内容。 |
| [`Go Markdow`](.github/skills/markdown-to-html/references/gomarkdown.md) | 提示词 | 用于将 Markdown 转换为 HTML，支持 Go 语言项目集成。 | 在 VS Code 中调用 Go 库或 CLI 工具进行 Markdown 转换。 |
| [`Hugo 静态生成`](.github/skills/markdown-to-html/references/hugo.md) | 提示词 | 帮助使用 Hugo 快速生成静态网站，支持 Markdown 内容管理。 | 在 VS Code 中编辑内容，使用 Hugo CLI 构建网站。 |
| [`Jekyll 网站生`](.github/skills/markdown-to-html/references/jekyll.md) | 提示词 | 用于将 Markdown 内容转化为完整网站，适用于博客和 GitHub Pages。 | 在 VS Code 中编辑 Markdown，使用 Jekyll CLI 构建网站。 |
| [`Marked 转换工`](.github/skills/markdown-to-html/references/marked.md) | 提示词 | 帮助快速将 Markdown 文件或字符串转换为 HTML，支持 CLI 和 Node.js。 | 在 VS Code 终端或 Node.js 脚本中调用 marked 命令进行转换。 |
| [`Pandoc 文档转`](.github/skills/markdown-to-html/references/pandoc.md) | 提示词 | 用于多格式文档互转，支持 Markdown、HTML、Word 等多种格式。 | 在 VS Code 终端中使用 pandoc 命令进行格式转换。 |
| [`表格转 HTML`](.github/skills/markdown-to-html/references/tables-to-html.md) | 提示词 | 帮助将 Markdown 表格转换为 HTML 表格，便于网页展示。 | 在 VS Code 中编辑 Markdown 表格，工具自动生成对应 HTML。 |
| [`表格生成`](.github/skills/markdown-to-html/references/tables.md) | 提示词 | 用于在 Markdown 中创建表格，优化信息展示结构。 | 在 VS Code 中插入表格语法，工具辅助生成标准表格。 |
| [`数学式转 HTML`](.github/skills/markdown-to-html/references/writing-mathematical-expressions-to-html.md) | 提示词 | 帮助将 Markdown 数学表达式转换为 HTML，支持 MathML 展示。 | 在 VS Code 中编辑数学公式，工具自动生成对应 HTML。 |
| [`数学表达式生成`](.github/skills/markdown-to-html/references/writing-mathematical-expressions.md) | 提示词 | 用于在 Markdown 中编写数学表达式，支持 LaTeX 语法。 | 在 VS Code 中插入 $...$ 或 $$...$$，工具辅助渲染数学内容。 |
| [`Markdown目录`](.github/skills/update-markdown-file-index/SKILL.md) | 提示词 | 自动更新 Markdown 文件目录，生成指定文件夹下的索引表。 | 在 VS Code 中通过 Copilot Chat 或命令面板调用，指定目标文件和目录自动生成索引。 |

## 🔒 安全审计

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`安全审计员`](.github/agents/gem-reviewer.agent.md) | Agent | 用于安全审计、代码审查、OWASP 扫描和 PRD 合规性验证，生成安全报告。 | 在 Copilot Chat 中选择“gem-reviewer”Agent，提交代码或 PR 进行安全扫描和合规性检查。 |
| [`安全编码指南`](.github/instructions/security-and-owasp.instructions.md) | 指令 | 用于安全编码指导，基于 OWASP Top 10 和行业最佳实践，提升代码安全性。 | 在 VS Code 编辑代码时自动应用安全建议；GitHub PR/提交时自动检查安全风险。 |
| [`安全审查助手`](.github/prompts/security-review.prompt.md) | 提示词 | 对选中代码进行安全审查，检测注入风险、权限缺失、敏感信息等安全问题。 | 在 VS Code 选中代码后右键选择“Copilot: Security Review”；GitHub PR 评论中可调用。 |
| [`安全审计助手`](.github/skills/security-review/SKILL.md) | 提示词 | 用于代码安全审计，智能检测漏洞、数据流和敏感信息。 | 在 VS Code 中通过 Copilot Chat 输入安全审计需求自动调用。 |
| [`语言漏洞模式`](.github/skills/security-review/references/language-patterns.md) | 提示词 | 提供语言特定的安全漏洞检测模式，辅助安全审计流程。 | 由安全审计助手自动加载，无需手动调用。 |
| [`安全报告模板`](.github/skills/security-review/references/report-format.md) | 提示词 | 用于生成标准化安全审计报告模板，规范输出结构。 | 由安全审计助手自动加载，无需手动调用。 |
| [`敏感信息检测`](.github/skills/security-review/references/secret-patterns.md) | 提示词 | 用于检测代码中的高置信度敏感信息和密钥模式。 | 由安全审计助手自动加载，无需手动调用。 |
| [`漏洞类别参考`](.github/skills/security-review/references/vuln-categories.md) | 提示词 | 提供各类安全漏洞详细检测指导，辅助漏洞分类与分析。 | 由安全审计助手自动加载，无需手动调用。 |
| [`漏洞包监控`](.github/skills/security-review/references/vulnerable-packages.md) | 提示词 | 帮助识别项目依赖中的高风险和已知漏洞包，指导版本升级以保障安全。 | 在 GitHub Pull Request 或安全审计流程中引用此清单，核查依赖包版本。 |
| [`安全认证参考`](.github/skills/web-coder/references/security-authentication.md) | 提示词 | 帮助检查网页安全、认证和加密实践，提供安全编码参考。 | 在 VS Code 中查阅安全或认证相关问题时自动触发。 |

## 🏗️ 架构设计

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`API 架构师`](.github/agents/api-architect.agent.md) | Agent | 帮助设计 API 架构并生成连接代码，指导工程师实现客户端与外部服务的集成。 | 在 VS Code Copilot Chat 中选择“API Architect”Agent，输入需求即可获得设计建议和代码示例。 |
| [`架构顾问`](.github/agents/architect.md) | Agent | 用于系统架构决策，提供设计模式、分布式系统和工程权衡建议。 | 在 Copilot Chat 中选择“Architect”Agent，提出设计相关问题获取建议。 |
| [`上下文架构师`](.github/agents/context-architect.agent.md) | Agent | 用于规划和执行多文件变更，识别相关上下文和依赖关系。 | 在 Copilot Chat 中选择“Context Architect”Agent，描述需要变更的任务，获取文件依赖和变更建议。 |
| [`架构模式参考`](.github/skills/web-coder/references/architecture-patterns.md) | 提示词 | 提供 Web 应用架构与设计模式参考，辅助系统架构决策与优化。 | 在 VS Code 或 GitHub 讨论架构时，查阅此文档获取架构建议。 |
| [`服务器架构参考`](.github/skills/web-coder/references/servers-infrastructure.md) | 提示词 | 用于了解和规范网页服务器、部署及基础设施架构。 | 在 VS Code 中查阅服务器或部署相关问题时自动触发。 |

## 📌 任务规划

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`上下文地图`](.github/skills/context-map/SKILL.md) | 提示词 | 帮助分析代码库并生成任务相关文件的上下文地图，便于变更前全面了解依赖关系。 | 在 VS Code 中通过 Copilot Chat 输入“生成任务上下文地图”或描述具体任务，自动触发分析。 |
| [`我的问题列表`](.github/skills/my-issues/SKILL.md) | 提示词 | 帮助列出当前仓库中分配给我的所有问题，并建议优先处理事项。 | 在 GitHub Copilot Chat 或命令面板中调用 my-issues 工具，自动获取相关问题。 |
| [`我的拉取请求`](.github/skills/my-pull-requests/SKILL.md) | 提示词 | 用于列出当前仓库中分配给我的所有拉取请求，并突出待审核项。 | 在 GitHub Copilot Chat 或命令面板中调用 my-pull-requests 工具，自动获取相关 PR。 |
| [`上下文需求分析`](.github/skills/what-context-needed/SKILL.md) | 提示词 | 用于分析回答问题前所需的文件上下文，帮助规划代码审查或开发任务。通过 Copilot 提示，列出相关文件及原因。 | 在 Copilot Chat 中输入问题，触发技能自动分析所需文件。 |

## 🤖 通用助手

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`DevOps专家`](.github/agents/devops-expert.agent.md) | Agent | 帮助自动化 DevOps 流程，涵盖计划、构建、测试、部署和监控等环节。 | 在 Copilot Chat 中选择“DevOps Expert”Agent，输入相关 DevOps 任务获取建议和操作指导。 |
| [`自动实验助手`](.github/skills/autoresearch/SKILL.md) | 提示词 | 用于自主迭代实验和代码优化，自动进行目标设定、测试和结果评估。 | 在 VS Code 命令面板输入“Copilot: Autoresearch”启动；GitHub Actions 可集成自动实验。 |
| [`代码运行器`](.github/skills/code-runner/SKILL.md) | 提示词 | 支持多语言代码片段运行，便于测试算法、验证输出和检查行为。 | 在 VS Code 选中代码后右键选择“Copilot: Run Code”；GitHub Actions 可集成自动运行。 |
| [`语言支持参考`](.github/skills/code-runner/references/LANGUAGES.md) | 提示词 | 提供支持语言参考和安装说明，帮助配置代码运行环境。 | 在 VS Code 查看文档或配置代码运行器时参考；GitHub README 可引用。 |
| [`代码执行脚本`](.github/skills/code-runner/scripts/run-code.cjs) | 提示词 | 用于执行代码片段的脚本，支持多种编程语言，便于自动化测试和验证。 | 在终端运行 `node run-code.cjs <languageId> "<code>"`；可被 Copilot 代码运行器调用。 |
| [`Word助手`](.github/skills/docx/SKILL.md) | 提示词 | 用于创建、编辑、读取和处理 Word 文档（.docx），支持内容提取和格式化。 | 在 Copilot Chat 输入“生成Word文档”或“编辑.docx文件”，自动触发该工具。 |
| [`GitHub CLI`](.github/skills/gh-cli/SKILL.md) | 提示词 | 提供 GitHub CLI 全面操作参考，支持仓库、Issue、PR、Actions 等命令行管理。 | 在 Copilot Chat 输入“GitHub CLI命令参考”或“操作GitHub”，自动调用该工具。 |
| [`Copilot配置助`](.github/skills/github-copilot-starter/SKILL.md) | 提示词 | 用于为新项目快速配置 GitHub Copilot，根据技术栈生成生产级配置。 | 在 Copilot Chat 输入“初始化Copilot配置”或“配置新项目”，自动调用该工具。 |
| [`LSP配置助手`](.github/skills/lsp-setup/SKILL.md) | 提示词 | 自动安装并配置 LSP 服务器，提升代码智能能力，支持多语言环境。 | 在 Copilot Chat 输入“配置LSP”或“启用代码智能”，自动触发该工具。 |
| [`LSP服务器参考`](.github/skills/lsp-setup/references/lsp-servers.md) | 提示词 | 提供已知 LSP 服务器参考及安装配置片段，便于快速集成多语言支持。 | 在 Copilot Chat 或配置流程中查阅 LSP 服务器列表和安装命令。 |
| [`技能模板生成`](.github/skills/make-skill-template/SKILL.md) | 提示词 | 用于创建新的 Copilot Agent Skill，支持模板生成和目录结构搭建。 | 在 Copilot Chat 输入“创建新Skill”或“生成技能模板”，自动调用该工具。 |
| [`PDF工具`](.github/skills/pdf/SKILL.md) | 提示词 | 帮助处理 PDF 文件，包括文本提取、合并拆分、加密解密、OCR 等操作。 | 在 VS Code 中通过 Copilot Chat 输入 PDF 相关需求自动调用。 |
| [`PPTX工具`](.github/skills/pptx/SKILL.md) | 提示词 | 用于处理 PPTX 文件，包括创建、编辑、提取文本、合并拆分等操作。 | 在 VS Code 中通过 Copilot Chat 输入 PPTX 相关需求自动调用。 |
| [`PPT编辑助手`](.github/skills/pptx/editing.md) | 提示词 | 帮助基于模板分析和编辑 PPTX 演示文稿，支持内容规划与布局。 | 在 VS Code 中通过 Copilot Chat 输入 PPT 编辑需求自动调用。 |
| [`PPTX编程生成`](.github/skills/pptx/pptxgenjs.md) | 提示词 | 用于通过 PptxGenJS 库编程生成和管理 PPTX 演示文稿。 | 在 VS Code 中通过 Copilot Chat 输入 PPTX 生成需求自动调用。 |
| [`Agent推荐助手`](.github/skills/suggest-awesome-github-copilot-agents/SKILL.md) | 提示词 | 用于推荐适合当前仓库的 Copilot Custom Agents，避免重复并识别过时代理。 | 在 Copilot Chat 中输入需求，自动推荐相关 Agent 文件。 |
| [`指令推荐助手`](.github/skills/suggest-awesome-github-copilot-instructions/SKILL.md) | 提示词 | 用于推荐适合当前仓库的 Copilot 指令文件，避免重复并识别过时指令。 | 在 Copilot Chat 中输入需求，自动推荐相关指令文件。 |
| [`技能推荐助手`](.github/skills/suggest-awesome-github-copilot-skills/SKILL.md) | 提示词 | 用于推荐适合当前仓库的 Copilot 技能文件，避免重复并识别过时技能。 | 在 Copilot Chat 中输入需求，自动推荐相关技能文件。 |
| [`Web开发专家`](.github/skills/web-coder/SKILL.md) | 提示词 | 提供全方位 Web 开发知识和标准，辅助前端、协议、安全、性能等领域问题解答。 | 在 Copilot Chat 中提问 Web 相关问题，自动调用此专家技能。 |
| [`无障碍参考`](.github/skills/web-coder/references/accessibility.md) | 提示词 | 提供 Web 无障碍标准与实践参考，帮助提升网站可访问性。 | 在开发 Web 页面时查阅，辅助实现无障碍设计。 |
| [`浏览器引擎参考`](.github/skills/web-coder/references/browsers-engines.md) | 提示词 | 提供主流浏览器及渲染引擎相关知识，便于兼容性和性能优化。 | 在前端开发或调试时查阅，辅助解决兼容性问题。 |
| [`CSS样式参考`](.github/skills/web-coder/references/css-styling.md) | 提示词 | 提供 CSS 与现代布局技术参考，帮助优化页面样式和响应式设计。 | 在编写或优化 CSS 时查阅，获取布局和样式建议。 |
| [`数据格式编码`](.github/skills/web-coder/references/data-formats-encoding.md) | 提示词 | 提供 Web 数据格式与编码知识，辅助数据序列化与解析。 | 在处理数据传输或存储时查阅，解决编码相关问题。 |
| [`开发工具参考`](.github/skills/web-coder/references/development-tools.md) | 提示词 | 提供 Web 开发常用工具与工作流参考，提升开发效率。 | 在开发过程中查阅，快速获取工具使用方法。 |
| [`Web术语表`](.github/skills/web-coder/references/glossary.md) | 提示词 | 提供 Web 领域术语词汇表，便于理解和查找相关概念。 | 在学习或查找 Web 相关术语时查阅，辅助理解专业词汇。 |
| [`许可证参考`](.github/skills/webapp-testing/LICENSE.txt) | 提示词 | 用于查阅 Apache License 2.0 许可条款，辅助理解工具使用范围。 | 在 VS Code 或 GitHub 中查阅 LICENSE 文件自动触发。 |
| [`表格处理助手`](.github/skills/xlsx/SKILL.md) | 提示词 | 用于处理电子表格文件，包括读取、编辑、创建和格式转换等任务。适用于 .xlsx、.csv 等多种表格格式。 | 在 Copilot Chat 中描述表格相关需求，自动调用技能进行操作。 |

---

*此文件由 [repos-ai-tools-maintain](https://github.com/knewbeing/repos-ai-tools-maintain) workflow 自动生成。*
