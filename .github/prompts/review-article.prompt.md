---
description: Review a docs article
argument-hint: Review a documentation article or section
tools: ['search', 'vscodeAPI', 'problems', 'fetch', 'githubRepo']
---

<!--
🔍 【中文注释】
  工具名称: 文档审查助手
  功能分类: 代码审查
  功能说明: 用于审查文档文章，检查写作风格、规范和内容质量。
  使用方式: 在 VS Code 选中文档后右键选择“Copilot: Review Article”；GitHub PR 评论中可调用。
  关键标签: 文档审查、写作规范、内容质量
-->

Review a documentation article by completing these tasks:

* Review the article for adherence to our documentation [writing style guidelines](../instructions/docs-writing.instructions.md).

* Validate technical accuracy:
    - Verify all code samples are syntactically correct and follow best practices
    - Test command-line instructions and procedures
    - Confirm API references and method names are current
    - Check that screenshots and images are up-to-date

* Evaluate structural organization:
    - The title accurately reflects the content
    - The metadata description is concise, informative, and optimized for SEO
    - The introduction provides a clear overview of the article's purpose
    - Sections are logically organized with proper heading hierarchy
    - Content flows logically without redundancy or repetitive language
    - Relevant next steps or related articles are linked at the end

After your analysis, provide a summary of your findings and actionable feedback for improvement. Group your findings into these categories: "Technical Accuracy," "Style and Grammar," "Structure and Organization," "Accessibility," and "SEO Optimization." For each category, list specific issues identified and suggest concrete improvements with examples.