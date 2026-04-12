# 🛠️ Copilot 工具索引

> 由 AI 自动整理分类，包含本仓库所有已安装的 GitHub Copilot 工具。
> 使用 GitHub Copilot Chat 或 VS Code 中的 Copilot 功能调用这些工具。

---

## 📋 编码规范

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`博客写作规范`](.github/instructions/blog-writing.instructions.md) | 指令 | 规范博客写作格式和内容，确保元数据和结构符合要求。 | 编辑博客 Markdown 文件时自动应用，或在 Copilot Chat 中请求规范建议。 |
| [`中文回复规则`](.github/instructions/chinese-response.instructions.md) | 指令 | 强制所有用户交互内容使用中文回复，规范沟通语言。 | 在 Copilot Chat 或 GitHub Copilot Agents 中自动生效，无需手动调用。 |
| [`Markdown 无`](.github/instructions/markdown-accessibility.instructions.md) | 指令 | 规范 Markdown 文件的无障碍性，提升文档包容性和可访问性。 | 编辑 Markdown 文件时自动应用，或在 Copilot Chat 中请求无障碍建议。 |
| [`Markdown 内`](.github/instructions/markdown-content-creation.instructions.md) | 指令 | 规范 Markdown 内容结构，统一标题、列表等格式。 | 编辑 Markdown 文件时自动应用，或在 Copilot Chat 中请求内容规范建议。 |
| [`GFM 格式规范`](.github/instructions/markdown-gfm.instructions.md) | 指令 | 规范 GitHub 风格 Markdown 格式，确保符合 GFM 规范。 | 编辑 Markdown 文件时自动应用，或在 Copilot Chat 中请求格式建议。 |
| [`CommonMark`](.github/instructions/markdown.instructions.md) | 指令 | 规范 CommonMark Markdown 格式，确保符合标准规范。 | 编辑 Markdown 文件时自动应用，或在 Copilot Chat 中请求格式建议。 |
| [`Node/Vites`](.github/instructions/nodejs-javascript-vitest.instructions.md) | 指令 | 规范 Node.js 和 JavaScript 代码编写，指导使用 Vitest 进行测试。 | 编辑 JS 文件时自动应用，或在 Copilot Chat 中请求编码和测试建议。 |
| [`规范提交助手`](.github/skills/conventional-commit/SKILL.md) | 提示词 | 用于生成符合 Conventional Commits 规范的标准化提交信息，指导用户编写结构化、描述性提交。 | 在 Copilot Chat 或 CLI 中输入“生成提交信息”或“规范提交”时自动触发。 |
| [`高级前端规范`](.github/skills/premium-frontend-ui/SKILL.md) | 提示词 | 指导前端开发编码规范，提升界面体验、性能和架构质量。 | 在 Copilot Chat 或 VS Code 中输入“前端规范”或“优化界面”自动调用。 |
| [`提示词构建`](.github/skills/prompt-builder/SKILL.md) | 提示词 | 帮助构建高质量 Copilot 提示词，规范结构和最佳实践。 | 在 Copilot Chat 中输入“构建提示词”或“优化 Copilot 提示”自动调用。 |
| [`HTML规范参考`](.github/skills/web-coder/references/html-markup.md) | 提示词 | 帮助规范 HTML 标记语言的使用，提供结构和语义最佳实践。适用于查阅 HTML 元素和文档结构。 | 在 VS Code 中通过 Copilot 插件查阅或自动补全 HTML 相关内容。 |
| [`CSS规范参考`](.github/skills/web-coder/references/css-styling.md) | 提示词 | 帮助规范 CSS 样式表的编写，涵盖布局和现代样式技巧。适用于查阅 CSS 属性和布局方法。 | 在 VS Code 中通过 Copilot 插件查阅或自动补全 CSS 相关内容。 |
| [`JS规范参考`](.github/skills/web-coder/references/javascript-programming.md) | 提示词 | 帮助规范 JavaScript 编程，提供语言特性和现代开发模式参考。适用于查阅 JS 语法和最佳实践。 | 在 VS Code 中通过 Copilot 插件查阅或自动补全 JavaScript 相关内容。 |
| [`数据格式规范`](.github/skills/web-coder/references/data-formats-encoding.md) | 提示词 | 帮助规范数据格式和编码，涵盖 JSON、序列化和字符编码。适用于查阅数据结构和编码方式。 | 在 VS Code 中通过 Copilot 插件查阅数据格式和编码相关内容。 |
| [`Web API规范`](.github/skills/web-coder/references/web-apis-dom.md) | 提示词 | 帮助规范 Web API 和 DOM 操作，提供接口和文档结构参考。适用于查阅 DOM 操作和 Web API。 | 在 VS Code 中通过 Copilot 插件查阅或自动补全 Web API 和 DOM 相关内容。 |
| [`媒体规范参考`](.github/skills/web-coder/references/media-graphics.md) | 提示词 | 帮助规范多媒体和图像格式的使用，提供图片格式和嵌入方法参考。适用于查阅图像处理和多媒体嵌入。 | 在 VS Code 中通过 Copilot 插件查阅或自动补全媒体相关内容。 |
| [`协议标准参考`](.github/skills/web-coder/references/web-protocols-standards.md) | 提示词 | 帮助规范 Web 协议和标准，提供组织与规范文档参考。适用于查阅标准协议和行业规范。 | 在 VS Code 中通过 Copilot 插件查阅 Web 协议和标准相关内容。 |
| [`浏览器规范参考`](.github/skills/web-coder/references/browsers-engines.md) | 提示词 | 帮助规范浏览器和渲染引擎相关知识，提供主流浏览器和开发工具参考。适用于查阅浏览器特性和兼容性。 | 在 VS Code 中通过 Copilot 插件查阅浏览器和引擎相关内容。 |
| [`服务器规范参考`](.github/skills/web-coder/references/servers-infrastructure.md) | 提示词 | 帮助规范服务器和基础设施配置，提供部署和主机参考。适用于查阅服务器配置和部署方法。 | 在 VS Code 中通过 Copilot 插件查阅服务器和部署相关内容。 |
| [`开发工具规范`](.github/skills/web-coder/references/development-tools.md) | 提示词 | 帮助规范开发工具和工作流，提供版本控制和工具链参考。适用于查阅开发流程和工具使用。 | 在 VS Code 中通过 Copilot 插件查阅开发工具和流程相关内容。 |
| [`网络协议规范`](.github/skills/web-coder/references/http-networking.md) | 提示词 | 帮助规范 HTTP 协议和网络通信，提供协议版本和通信方式参考。适用于查阅网络协议和通信方法。 | 在 VS Code 中通过 Copilot 插件查阅 HTTP 和网络相关内容。 |
| [`性能优化规范`](.github/skills/web-coder/references/performance-optimization.md) | 提示词 | 帮助规范性能优化方法，提供核心指标和优化技巧参考。适用于查阅性能指标和优化建议。 | 在 VS Code 中通过 Copilot 插件查阅性能优化相关内容。 |

## 🔍 代码审查

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`代码审查规范`](.github/instructions/code-review-generic.instructions.md) | 指令 | 提供通用代码审查流程和最佳实践，辅助提升代码质量。 | 在 PR 或代码评审环节自动应用，或在 Copilot Chat 中请求审查建议。 |
| [`三层验证助手`](.github/skills/doublecheck/SKILL.md) | 提示词 | 用于对 AI 输出进行三层验证，提取可验证声明、查找支持/反对证据并生成结构化报告。 | 在 Copilot Chat 中输入“验证AI输出”或“生成验证报告”时自动触发。 |
| [`验证报告模板`](.github/skills/doublecheck/assets/verification-report-template.md) | 提示词 | 用于生成结构化验证报告模板，帮助人工审查 AI 输出的真实性和风险。 | 由三层验证助手自动调用，或在 Copilot Chat 中请求“生成验证报告模板”时触发。 |
| [`网页设计审查`](.github/skills/web-design-reviewer/SKILL.md) | 提示词 | 用于审查网站设计，自动检测并修复响应式、可访问性和布局问题。适用于请求 UI 检查和设计问题修复。 | 在 VS Code 或 GitHub Copilot 中输入“review website design”或“check the UI”触发审查。 |
| [`视觉检查清单`](.github/skills/web-design-reviewer/references/visual-checklist.md) | 提示词 | 帮助检查网页设计的视觉规范，确保布局、结构和样式符合标准。通过清单逐项核查页面元素。 | 在 Copilot Chat 中输入“请按视觉检查清单审查页面”或直接引用该文件内容。 |

## ♻️ 代码重构

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`性能优化指南`](.github/instructions/performance-optimization.instructions.md) | 指令 | 提供性能优化最佳实践，覆盖前端、后端和数据库，辅助代码重构和性能提升。 | 在 Copilot Chat 或代码重构环节请求优化建议，自动应用于相关代码。 |
| [`代码重构助手`](.github/skills/refactor/SKILL.md) | 提示词 | 用于代码重构，提升可维护性，支持函数提取、变量重命名、消除代码异味等。 | 在 Copilot Chat 或 VS Code 中输入“重构代码”或“优化结构”自动调用。 |
| [`重构计划制定`](.github/skills/refactor-plan/SKILL.md) | 提示词 | 帮助制定多文件重构计划，合理安排顺序并支持回滚步骤。 | 在 Copilot Chat 中输入“制定重构计划”或“多文件重构”自动调用。 |
| [`框架修复指南`](.github/skills/web-design-reviewer/references/framework-fixes.md) | 提示词 | 用于指导不同前端框架和样式方法的修复技巧，优化布局和样式问题。根据框架类型给出具体代码修复建议。 | 在 Copilot Chat 中输入“请根据框架修复指南优化代码”或直接引用该文件内容。 |

## 🧪 测试辅助

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`Playwright`](.github/agents/playwright-tester.agent.md) | Agent | 用于生成和执行 Playwright 测试，分析测试结果并定位问题。 | 在 VS Code Copilot Agents 面板中选择 Playwright Tester agent，或通过 Copilot Chat 指定调用。 |
| [`网站探索测试`](.github/skills/playwright-explore-website/SKILL.md) | 提示词 | 用于网站探索测试，自动识别并交互核心功能，辅助测试流程。 | 在 Copilot Chat 中输入“探索网站”或“测试网站功能”自动调用。 |
| [`自动生成测试`](.github/skills/playwright-generate-test/SKILL.md) | 提示词 | 帮助根据场景生成 Playwright 自动化测试脚本，提升测试效率。 | 在 Copilot Chat 中输入“生成测试脚本”或“为场景生成测试”自动调用。 |
| [`Vue Pinia单`](.github/skills/unit-test-vue-pinia/SKILL.md) | 提示词 | 帮助编写和审查 Vue 3 + TypeScript + Pinia 的单元测试，支持组件、状态管理和黑盒测试。 | 在 VS Code 中通过 Copilot Chat 输入 /unit-test-vue-pinia 命令调用，或在 GitHub PR 审查时使用。 |
| [`Pinia测试模式`](.github/skills/unit-test-vue-pinia/references/pinia-patterns.md) | 提示词 | 提供 Pinia 状态管理相关的测试代码片段和最佳实践。 | 由单元测试工具自动加载，或在编写 Pinia 测试时参考。 |
| [`Web 应用测试工具`](.github/skills/webapp-testing/SKILL.md) | 提示词 | 帮助自动化测试本地 Web 应用，支持功能验证、UI 调试、截图和日志查看。通过 Playwright 脚本实现测试。 | 在 VS Code 中运行 Playwright 脚本或在 Copilot Chat 中输入“请使用 webapp-testing 工具测试页面”。 |
| [`控制台日志捕获`](.github/skills/webapp-testing/examples/console_logging.py) | 提示词 | 用于捕获浏览器自动化过程中的控制台日志，便于调试和分析页面行为。通过 Playwright 自动收集日志信息。 | 在 VS Code 中运行该 Python 脚本，或在 Copilot Chat 中请求“捕获页面控制台日志”。 |
| [`元素发现脚本`](.github/skills/webapp-testing/examples/element_discovery.py) | 提示词 | 帮助自动发现页面上的按钮及其他元素，便于测试和自动化操作。通过 Playwright 自动识别页面元素。 | 在 VS Code 中运行该 Python 脚本，或在 Copilot Chat 中请求“发现页面元素”。 |
| [`静态页面自动化`](.github/skills/webapp-testing/examples/static_html_automation.py) | 提示词 | 用于自动化操作本地静态 HTML 文件，支持文件交互和页面测试。通过 Playwright 实现自动化访问和操作。 | 在 VS Code 中运行该 Python 脚本，或在 Copilot Chat 中请求“自动化测试本地 HTML 文件”。 |
| [`服务器测试脚本`](.github/skills/webapp-testing/scripts/with_server.py) | 提示词 | 帮助启动一个或多个服务器并自动执行测试脚本，适用于多端测试场景。通过命令行自动管理服务器和测试流程。 | 在终端运行“python scripts/with_server.py --server ... --port ... -- python 测试脚本”。 |

## 📝 文档生成

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`文档写作规范`](.github/instructions/docs-writing.instructions.md) | 指令 | 规范文档写作风格，提升文档简洁性和易读性。 | 编辑文档 Markdown 文件时自动应用，或在 Copilot Chat 中请求文档建议。 |
| [`文档专家`](.github/skills/documentation-writer/SKILL.md) | 提示词 | 帮助编写高质量软件文档，遵循 Diátaxis 框架，提升文档结构和专业性。 | 在 Copilot Chat 中输入“生成文档”或“技术写作”需求时自动触发。 |
| [`Markdown转H`](.github/skills/markdown-to-html/SKILL.md) | 提示词 | 帮助将 Markdown 文件转换为 HTML，支持多种转换工具和自定义脚本。 | 在 Copilot 中输入“convert markdown to html”或调用 markdown-to-html skill 自动执行。 |
| [`基础Markdown`](.github/skills/markdown-to-html/references/basic-markdown-to-html.md) | 提示词 | 用于演示 Markdown 标题等基础语法的 HTML 转换效果，便于理解格式对应关系。 | 参考文档内容，或在 Copilot markdown-to-html skill 中查看转换示例。 |
| [`基础Markdown`](.github/skills/markdown-to-html/references/basic-markdown.md) | 提示词 | 帮助掌握 Markdown 基础写作和格式语法，便于在 GitHub 上编写规范文档。 | 在 GitHub 编辑器或 Copilot 中查阅语法说明，辅助文档编写。 |
| [`代码块转HTML`](.github/skills/markdown-to-html/references/code-blocks-to-html.md) | 提示词 | 用于展示 Markdown 代码块转为 HTML 的具体效果，支持无语言和高亮代码块。 | 参考文档内容，或在 Copilot markdown-to-html skill 中查看代码块转换示例。 |
| [`代码块语法`](.github/skills/markdown-to-html/references/code-blocks.md) | 提示词 | 帮助创建和高亮 Markdown 代码块，便于分享代码片段和格式化展示。 | 在 GitHub 编辑器或 Copilot 中查阅语法说明，辅助代码展示。 |
| [`折叠区转HTML`](.github/skills/markdown-to-html/references/collapsed-sections-to-html.md) | 提示词 | 用于展示 Markdown 折叠区域（<details>标签）转为 HTML 的效果，便于信息收纳。 | 参考文档内容，或在 Copilot markdown-to-html skill 中查看折叠区转换示例。 |
| [`折叠区语法`](.github/skills/markdown-to-html/references/collapsed-sections.md) | 提示词 | 帮助创建 Markdown 折叠区域，便于组织和隐藏技术细节。 | 在 GitHub 编辑器或 Copilot 中查阅语法说明，辅助文档结构优化。 |
| [`gomarkdown`](.github/skills/markdown-to-html/references/gomarkdown.md) | 提示词 | 用于介绍 Go 语言 gomarkdown 库的安装与使用，支持 Markdown 转 HTML。 | 参考文档内容，或在 Copilot markdown-to-html skill 中调用 gomarkdown 相关功能。 |
| [`Hugo工具参考`](.github/skills/markdown-to-html/references/hugo.md) | 提示词 | 帮助安装和使用 Hugo 静态网站生成器，实现 Markdown 到 HTML 的快速转换。 | 参考文档内容，或在 Copilot markdown-to-html skill 中调用 Hugo 相关功能。 |
| [`Jekyll工具参考`](.github/skills/markdown-to-html/references/jekyll.md) | 提示词 | 用于介绍 Jekyll 静态网站生成器的安装与用法，支持 Markdown 内容转网站。 | 参考文档内容，或在 Copilot markdown-to-html skill 中调用 Jekyll 相关功能。 |
| [`marked工具参考`](.github/skills/markdown-to-html/references/marked.md) | 提示词 | 帮助使用 marked 工具快速将 Markdown 转为 HTML，支持 CLI 和 Node.js 脚本。 | 参考文档内容，或在 Copilot markdown-to-html skill 中调用 marked 相关功能。 |
| [`Pandoc工具参考`](.github/skills/markdown-to-html/references/pandoc.md) | 提示词 | 用于介绍 Pandoc 万能文档转换工具的安装与用法，支持 Markdown 与多种格式互转。 | 参考文档内容，或在 Copilot markdown-to-html skill 中调用 Pandoc 相关功能。 |
| [`表格转HTML`](.github/skills/markdown-to-html/references/tables-to-html.md) | 提示词 | 用于展示 Markdown 表格转为 HTML 的效果，便于结构化数据展示。 | 参考文档内容，或在 Copilot markdown-to-html skill 中查看表格转换示例。 |
| [`表格生成`](.github/skills/markdown-to-html/references/tables.md) | 提示词 | 帮助在 Markdown 中创建和展示表格，便于信息整理和展示。支持通过管道符和横线定义表头和内容。 | 在 GitHub 评论、Issue、PR 或 Wiki 中插入表格语法即可自动渲染。 |
| [`数学表达式转HTML`](.github/skills/markdown-to-html/references/writing-mathematical-expressions-to-html.md) | 提示词 | 用于将 Markdown 中的数学表达式转为 HTML，支持内联和块级数学公式展示。 | 在 Markdown 中使用 $...$ 或 $$...$$ 书写数学表达式，GitHub 自动渲染为 HTML。 |
| [`数学表达式编写`](.github/skills/markdown-to-html/references/writing-mathematical-expressions.md) | 提示词 | 帮助在 Markdown 中编写和展示 LaTeX 格式的数学表达式，提升文档表达能力。 | 在 GitHub Markdown 文件中使用 LaTeX 语法，自动渲染数学公式。 |
| [`Markdown索引`](.github/skills/update-markdown-file-index/SKILL.md) | 提示词 | 用于自动更新 Markdown 文件中的目录或索引，提升文档可读性。 | 在 VS Code 中通过 Copilot Chat 输入 /update-markdown-file-index 命令调用，或在 GitHub Actions 工作流中集成。 |

## 🔒 安全审计

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`安全审计员`](.github/agents/gem-reviewer.agent.md) | Agent | 帮助审计安全问题、检测敏感信息并验证需求合规，生成安全审计报告。 | 在 GitHub PR 或 VS Code Copilot Agents 面板中选择 gem-reviewer agent，自动扫描代码安全。 |
| [`安全编码指南`](.github/instructions/security-and-owasp.instructions.md) | 指令 | 帮助所有语言和框架实现安全编码，基于 OWASP Top 10 和行业最佳实践。用于生成、审查或重构代码时优先考虑安全。 | 在 VS Code 或 GitHub Copilot 中自动应用于所有代码生成和审查场景，无需手动调用。 |
| [`安全审计`](.github/skills/security-review/SKILL.md) | 提示词 | 帮助扫描代码库中的安全漏洞，追踪数据流、组件交互并发现常规工具遗漏的风险。 | 在 VS Code 中通过 Copilot Chat 输入 /security-review 命令调用，或在 GitHub Actions 工作流中集成。 |
| [`语言漏洞模式`](.github/skills/security-review/references/language-patterns.md) | 提示词 | 用于识别各编程语言的安全漏洞模式，辅助安全审计流程。 | 由安全审计工具自动加载，或在安全检查时参考。 |
| [`安全报告模板`](.github/skills/security-review/references/report-format.md) | 提示词 | 用于生成标准化安全审计报告，统一输出结构和内容。 | 由安全审计工具自动调用生成报告，或在输出安全检查结果时参考。 |
| [`密钥检测模式`](.github/skills/security-review/references/secret-patterns.md) | 提示词 | 用于检测代码中的高置信度敏感信息和密钥泄露。 | 由安全审计工具自动加载，或在敏感信息扫描时参考。 |
| [`漏洞类别参考`](.github/skills/security-review/references/vuln-categories.md) | 提示词 | 帮助识别和分类各类安全漏洞，提供详细检测指导。 | 由安全审计工具自动加载，或在漏洞分析时参考。 |
| [`高危依赖清单`](.github/skills/security-review/references/vulnerable-packages.md) | 提示词 | 用于审计依赖包的安全风险，识别高危版本和修复建议。 | 由安全审计工具自动加载，或在依赖检查时参考。 |
| [`安全认证参考`](.github/skills/web-coder/references/security-authentication.md) | 提示词 | 用于审查安全与认证，提供加密和安全编码实践参考。适用于查阅安全原则和认证方法。 | 在 VS Code 中通过 Copilot 插件查阅安全和认证相关内容。 |

## 🏗️ 架构设计

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`API 架构师`](.github/agents/api-architect.agent.md) | Agent | 帮助设计 API 架构，指导工程师实现客户端与外部服务的连接。通过生成设计方案和示例代码，提升 API 设计质量。 | 在 VS Code 的 Copilot Chat 中选择 API Architect agent，或在 GitHub Copilot Agents 面板中调用。 |
| [`上下文架构师`](.github/agents/context-architect.agent.md) | Agent | 用于规划多文件变更，识别相关上下文和依赖关系，辅助跨文件任务执行。 | 在 VS Code Copilot Agents 面板中选择 Context Architect agent，或通过 Copilot Chat 指定调用。 |
| [`LSP服务器参考`](.github/skills/lsp-setup/references/lsp-servers.md) | 提示词 | 帮助配置和集成多语言 LSP 服务器，实现智能代码补全和语法分析。通过参考安装命令和配置片段快速部署。 | 在 VS Code 中通过 Copilot CLI 的 lsp-setup skill 自动调用，或参考文档手动配置。 |
| [`架构模式参考`](.github/skills/web-coder/references/architecture-patterns.md) | 提示词 | 帮助理解和应用 Web 应用架构及设计模式，支持架构决策。 | 由架构设计相关工具自动加载，或在系统设计讨论时参考。 |
| [`架构术语表`](.github/skills/web-coder/references/glossary.md) | 提示词 | 用于查阅 Web 架构相关术语，帮助理解系统设计和领域知识。适用于查找架构和技术术语。 | 在 VS Code 中通过 Copilot 插件查阅 Web 架构和术语相关内容。 |

## 📌 任务规划

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`自动研究助手`](.github/skills/autoresearch/SKILL.md) | 提示词 | 用于自动化迭代实验和代码优化，指导用户定义目标、指标和约束，并循环执行代码改进、测试和结果筛选。 | 在 Copilot Chat 中输入“自动优化”或“实验循环”相关需求时自动触发，也可通过 Copilot CLI 调用。 |
| [`上下文映射`](.github/skills/context-map/SKILL.md) | 提示词 | 帮助分析代码库并生成与任务相关的文件和依赖关系映射，便于变更前全局把控。 | 在 Copilot Chat 中输入“分析上下文”或“生成依赖映射”时自动触发。 |
| [`我的问题列表`](.github/skills/my-issues/SKILL.md) | 提示词 | 用于列出当前仓库中分配给我的 Issue，并根据优先级推荐关注事项。 | 在 Copilot Chat 或 VS Code 中输入“列出我的 Issue”自动调用。 |
| [`我的PR列表`](.github/skills/my-pull-requests/SKILL.md) | 提示词 | 帮助列出当前仓库中分配给我的 Pull Request，并提示待审核事项。 | 在 Copilot Chat 或 VS Code 中输入“列出我的 PR”自动调用。 |
| [`上下文需求指引`](.github/skills/what-context-needed/SKILL.md) | 提示词 | 用于指导 Copilot 明确回答问题前所需的上下文文件，帮助拆解需求和规划分析范围。 | 在 Copilot Chat 中输入“请告诉我需要哪些文件才能回答我的问题”。 |

## 🤖 通用助手

| 工具 | 类型 | 说明 | 使用方式 |
|------|------|------|----------|
| [`DevOps 专家`](.github/agents/devops-expert.agent.md) | Agent | 用于 DevOps 全流程自动化与协作，覆盖计划、编码、构建、测试、部署等环节。 | 在 VS Code Copilot Agents 面板中选择 DevOps Expert agent，或通过 Copilot Chat 指定调用。 |
| [`代码运行器`](.github/skills/code-runner/SKILL.md) | 提示词 | 帮助运行多种编程语言的代码片段，支持算法测试、脚本执行和输出验证。 | 在 Copilot Chat 中输入“运行代码”或“测试算法”时自动触发，也可通过 Copilot CLI 命令调用。 |
| [`语言支持参考`](.github/skills/code-runner/references/LANGUAGES.md) | 提示词 | 提供支持的编程语言列表及安装说明，便于快速查找和配置运行环境。 | 在 Copilot Chat 或代码运行器技能中查询“支持语言”或“安装说明”时自动显示。 |
| [`代码执行脚本`](.github/skills/code-runner/scripts/run-code.cjs) | 提示词 | 用于执行代码片段脚本，支持多语言自动检测和运行。 | 在终端中通过“node run-code.js <languageId> "<code>"”命令手动调用，也可被 Copilot 代码运行器自动调用。 |
| [`Word文档助手`](.github/skills/docx/SKILL.md) | 提示词 | 用于创建、读取、编辑和处理 Word 文档，支持内容提取和格式化。 | 在 Copilot Chat 中输入“生成Word文档”或“.docx”相关需求时自动触发。 |
| [`GitHub CLI`](.github/skills/gh-cli/SKILL.md) | 提示词 | 提供 GitHub CLI 全面操作参考，支持仓库、Issue、PR、Actions 等命令行操作。 | 在 Copilot Chat 或 CLI 中输入“GitHub命令行”或“gh操作”时自动触发。 |
| [`智能提交助手`](.github/skills/git-commit/SKILL.md) | 提示词 | 帮助执行 git commit 操作，自动分析变更并生成规范化提交信息。 | 在 Copilot Chat 或 CLI 中输入“提交代码”或“/commit”时自动触发。 |
| [`Copilot配置助`](.github/skills/github-copilot-starter/SKILL.md) | 提示词 | 用于为新项目快速配置 GitHub Copilot，根据技术栈生成完整配置。 | 在 Copilot Chat 中输入“配置Copilot”或“新项目初始化”时自动触发。 |
| [`LSP配置助手`](.github/skills/lsp-setup/SKILL.md) | 提示词 | 帮助安装和配置 LSP 服务器，实现代码智能（跳转、提示、类型信息）功能。 | 在 Copilot Chat 或 CLI 中输入“配置LSP”或“代码智能”需求时自动触发。 |
| [`技能模板生成`](.github/skills/make-skill-template/SKILL.md) | 提示词 | 用于创建新的 Copilot Agent 技能，支持从提示词或模板快速生成技能文件和目录结构。 | 在 GitHub Copilot 中输入“create a skill”或“make a new skill”自动触发，或复制模板手动创建。 |
| [`PDF助手`](.github/skills/pdf/SKILL.md) | 提示词 | 用于处理 PDF 文件，包括读取、合并、拆分、加水印、OCR、加密等多种操作。 | 在 Copilot Chat 或 VS Code 中输入“处理 PDF”相关指令自动调用。 |
| [`PPTX助手`](.github/skills/pptx/SKILL.md) | 提示词 | 用于处理 PPTX 文件，包括创建、编辑、合并、拆分、提取内容等多种操作。 | 在 Copilot Chat 或 VS Code 中输入“处理 PPTX”相关指令自动调用。 |
| [`PPTX编辑`](.github/skills/pptx/editing.md) | 提示词 | 帮助基于模板分析和编辑 PPTX 演示文稿，支持内容规划和布局调整。 | 在 Copilot Chat 中输入“编辑 PPTX”或“基于模板修改演示文稿”自动调用。 |
| [`PPTX生成`](.github/skills/pptx/pptxgenjs.md) | 提示词 | 用于通过 PptxGenJS 库生成和编辑 PPTX 文件，支持自定义布局和内容。 | 在 Node.js 项目中引入 pptxgenjs 库，或在 Copilot Chat 中输入“生成 PPTX”自动调用。 |
| [`Agent推荐助手`](.github/skills/suggest-awesome-github-copilot-agents/SKILL.md) | 提示词 | 用于推荐适合当前仓库的 Copilot Custom Agents，避免重复并识别过时工具。 | 在 VS Code 中通过 Copilot Chat 输入 /suggest-awesome-github-copilot-agents 命令调用。 |
| [`指令推荐助手`](.github/skills/suggest-awesome-github-copilot-instructions/SKILL.md) | 提示词 | 用于推荐适合当前仓库的 Copilot 指令文件，避免重复并识别过时内容。 | 在 VS Code 中通过 Copilot Chat 输入 /suggest-awesome-github-copilot-instructions 命令调用。 |
| [`技能推荐助手`](.github/skills/suggest-awesome-github-copilot-skills/SKILL.md) | 提示词 | 用于推荐适合当前仓库的 Copilot 技能文件，避免重复并识别过时内容。 | 在 VS Code 中通过 Copilot Chat 输入 /suggest-awesome-github-copilot-skills 命令调用。 |
| [`Web开发专家`](.github/skills/web-coder/SKILL.md) | 提示词 | 帮助处理 Web 开发相关问题，涵盖协议、标准、性能、安全和可访问性。 | 在 VS Code 中通过 Copilot Chat 输入 /web-coder 命令调用，或在 Web 项目开发时辅助。 |
| [`可访问性参考`](.github/skills/web-coder/references/accessibility.md) | 提示词 | 用于提升 Web 内容的可访问性，参考 WCAG 标准和最佳实践。 | 由 Web 开发相关工具自动加载，或在无障碍优化时参考。 |
| [`表格处理助手`](.github/skills/xlsx/SKILL.md) | 提示词 | 帮助处理和转换各类表格文件，包括 .xlsx、.csv 等，支持数据编辑、格式化和转换。 | 在 Copilot Chat 中输入“请用 xlsx 工具处理表格文件”或引用该文件内容。 |
| [`测试工具许可协议`](.github/skills/webapp-testing/LICENSE.txt) | 提示词 | 用于说明 Web 应用测试工具的使用许可和版权信息，保障合规使用。 | 在需要了解工具许可时查阅该文件。 |

---

*此文件由 [repos-ai-tools-maintain](https://github.com/knewbeing/repos-ai-tools-maintain) workflow 自动生成。*
