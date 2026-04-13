# 会话需求记录

**日期**：2026-04-12

---

## 需求 1：修复 Plausible Analytics CORS / 429 错误

**问题描述**：  
构建后发布到 GitHub Pages，控制台出现以下错误：

```
Access to fetch at 'https://plausible.io/api/event' from origin 'https://www.dmsrs.org'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.

POST https://plausible.io/api/event net::ERR_FAILED 429 (Too Many Requests)
```

**根本原因**：  
VitePress SPA 导航时对全局 `head` 中的外部 `<script>` 标签去重失败，导致 Plausible 脚本被重复注入，两个实例同时 patch `history.pushState`，每次导航触发双倍请求，超出速率限制（429），429 响应无 CORS 头，触发 CORS 错误。

**处理方式**：改为用内联 IIFE + `window.__plausibleInit` 标志防止重复加载（后被需求 2 替代）。

**涉及文件**：`.vitepress/head.ts`

---

## 需求 2：完全移除 Plausible Analytics

**问题描述**：  
用户不需要流量统计功能，要求彻底去掉 `plausible.io` 相关代码。

**处理方式**：

1. `.vitepress/head.ts`：
   - 删除 `import process from 'node:process'`
   - 删除 `plausibleScript` 变量定义
   - 删除生产环境条件注入块 `...(isProduction ? [plausibleScript] : [])`

2. `.vitepress/config.ts`：
   - 删除开发环境 Plausible 代理配置（`/assets/page-external-data/js` 和 `/api/v1/page-external-data`）

**提交记录**：`c8d8fa1 chore: 移除 Plausible 分析配置`  
**分支**：`2026/04/13/0044-remove-Plausible-proxy-and-script`（已推送到远程）

---

## 需求 3：将会话需求保存到 OrderToAi 目录

**问题描述**：  
用户要求将本次会话中提到的所有需求整理并保存到项目根目录下的 `OrderToAi` 文件夹。

**处理方式**：创建 `OrderToAi/2026-04-12-session-requirements.md` 文件记录本次会话需求。
