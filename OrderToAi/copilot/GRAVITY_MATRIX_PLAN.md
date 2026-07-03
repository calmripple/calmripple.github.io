# 引力矩阵分片图谱计划

## 目标

把 `zh-CN/笔记` 下的 Markdown 笔记按知识相关性生成可在 Web 端加载的加权图谱数据集，并将数据拆分为多个 JSON 小文件。`/graph-view/` 页面通过运行时加载 `manifest`、节点分片和跨分片边数据，渐进展示引力矩阵图谱，避免把完整图谱打入首屏 JavaScript 包。

## 当前实现状态

第一版已经完成最小可用闭环：

- 新增 `scripts/generate-gravity-matrix.ts`，用于扫描 `zh-CN/笔记/**/*.md` 并生成引力矩阵数据。
- 扩展 `packages/vitepress-plugin-graph-view/src/vitepress/graph.ts` 的图谱类型，兼容旧 `GraphViewData`，新增 `GravityMatrixNode`、`GravityMatrixEdge`、`GravityMatrixManifest`、`GravityMatrixChunk` 等结构。
- 新增 `packages/vitepress-plugin-graph-view/src/client/loaders/gravityMatrix.ts`，负责前端加载 `manifest`、分片 chunk 和 bridge 文件，并合并为 `GraphViewData`。
- 更新 `zh-CN/graph-view/index.md`，从静态导入 `.vitepress/graph.data` 改为运行时分片加载。
- 更新 `packages/vitepress-plugin-graph-view/src/client/components/NolebaseGraphView3D.vue`，让 3D 图谱消费边权重，并显示加载状态和进度文案。
- 在 `package.json` 中加入 `graph:matrix` 脚本，并接入 `prebuild` 与 `build:test`。
- 新增 `packages/vitepress-plugin-graph-view/src/client/loaders/gravityMatrix.test.ts`，覆盖分片加载器的路径拼接、数据合并和错误处理。

本轮交互增强计划：

- 已完成：鼠标滑过节点时，将非相关节点降为暗色，只保留当前节点、直接相关节点和相关边的高亮状态。
- 已完成：节点拖动时增强动态感，拖动节点保持高亮、重热力模拟，释放后保持当前节点聚焦。
- 已完成：增加关系说明面板，展示当前聚焦节点、相关节点数量、连接强度最高的关系，以及边的来源说明。
- 已完成：保持点击节点跳转文章的行为不变，避免交互增强破坏原有导航。

本轮聚焦可读性增强计划：

- 已完成：鼠标滑过节点时，不再仅仅变暗非相关节点，而是隐藏非相关节点和非相关连线。
- 已完成：聚焦状态下，在 3D 场景中显示当前节点和直接相关节点的标题，帮助读者直接识别相关知识点。
- 已完成：关系说明面板继续展示相关节点标题、连接强度和关系类型，作为图中标签的补充说明。
- 已完成：无聚焦节点时恢复完整图谱，避免默认视图信息缺失。

当前生成结果：

- 节点数：367
- 加权边数：4099
- 输出文件数：18
- 输出目录：`public/graph-data/gravity-matrix/`
- 文件结构：`manifest.json`、`chunks/*.json`、`bridges/*.json`

## 数据契约

### 节点

节点继承现有 `GraphViewNode`，并增加分片与度数信息：

```ts
interface GravityMatrixNode extends GraphViewNode {
  chunkId?: string
  degree?: number
}
```

### 边

边继承现有 `GraphViewEdge`，并增加权重和解释信息：

```ts
interface GravityMatrixEdge extends GraphViewEdge {
  weight: number
  relationTypes: string[]
  scoreBreakdown: Record<string, number>
}
```

字段含义：

- `weight`：归一化到 0 到 1，用于影响 3D 图谱中的连线宽度、距离和粒子效果。
- `relationTypes`：边的来源，例如 `markdown`、`wikilink`、`content-similarity`、`tag-overlap`、`directory-neighbor`、`title-overlap`。
- `scoreBreakdown`：保留每类相关性来源的分值，便于调试和后续 UI 解释。

### Manifest

`manifest.json` 是前端加载入口，包含版本、统计、分片清单、跨分片边文件列表和轻量节点索引。

核心字段：

- `version`
- `generatedAt`
- `totalNodes`
- `totalEdges`
- `chunkSizeTarget`
- `chunks[]`
- `bridgePaths[]`
- `nodeIndex[]`

## 相关性计算策略

第一版采用本地确定性算法，不依赖远程 AI、LLM 或 embedding 服务，保证构建可复现。

AI 增强生成已作为显式 opt-in 能力加入：默认不启用，不会把笔记内容发送到外部服务；当设置 `GRAVITY_MATRIX_AI=1` 且提供 `GRAVITY_MATRIX_AI_API_KEY` 或 `OPENAI_API_KEY` 时，生成脚本会调用 OpenAI-compatible embeddings API，为每篇笔记生成语义向量，再把 AI 语义相似度加入边权计算。

AI 模式环境变量：

- `GRAVITY_MATRIX_AI=1`：启用 AI embedding。
- `GRAVITY_MATRIX_AI_API_KEY` 或 `OPENAI_API_KEY`：OpenAI-compatible API key。
- `GRAVITY_MATRIX_AI_BASE_URL` 或 `OPENAI_BASE_URL`：可选，默认 `https://api.openai.com/v1`。
- `GRAVITY_MATRIX_AI_MODEL`：可选，默认 `text-embedding-3-small`。
- `GRAVITY_MATRIX_AI_BATCH_SIZE`：可选，默认 24。
- `GRAVITY_MATRIX_AI_STRICT=1`：可选，AI 请求失败时直接失败；默认失败后回退本地算法。

AI 模式只发送每篇笔记的标题、分类、标签、前若干标题和正文清洗摘要，不发送完整 Markdown 原文、代码块或 frontmatter 原始内容。

每篇笔记提取以下特征：

- 标题
- URL
- 文件路径
- 目录层级
- frontmatter 中的标签和分类
- Markdown 标题
- 正文关键词
- Markdown 链接、HTML 链接和 wikilink

边权重来源：

- AI embedding 语义相似：`ai-embedding`
- 显式链接：`markdown`、`wikilink`、`html`
- 正文关键词相似：`content-similarity`
- 标签或分类重叠：`tag-overlap`
- 目录邻近：`directory-neighbor`
- 标题和前几个 heading 的重叠：`title-overlap`

为控制体积，每个节点只保留权重最高的一部分相关边，同时显式链接会被优先保留。

AI 模式执行示例：

```bash
GRAVITY_MATRIX_AI=1 OPENAI_API_KEY=... pnpm graph:matrix
```

无 API key 或未启用 AI 时，执行命令保持不变：

```bash
pnpm graph:matrix
```

## 分片策略

生成目录为：

```text
public/graph-data/gravity-matrix/
```

当前结构：

```text
public/graph-data/gravity-matrix/
  manifest.json
  chunks/
    chunk-000.json
    chunk-001.json
    ...
  bridges/
    bridge-000.json
    bridge-001.json
    ...
```

分片规则：

- 节点按分类和路径排序后分片。
- `chunkSizeTarget` 当前为 40 个节点。
- chunk 内保存本分片节点和分片内部边。
- 跨 chunk 的边写入 `bridges/*.json`。
- bridge 当前每片约 300 条边。

这样可以避免单个大 JSON 文件阻塞页面加载，并让 `/graph-view/` 渐进更新图谱。

## 前端加载流程

`zh-CN/graph-view/index.md` 当前加载流程：

1. 页面挂载时创建 `AbortController`。
2. 调用 `loadGravityMatrixGraph`。
3. 根据 VitePress `site.value.base` 拼接静态资源路径。
4. 先加载 `manifest.json`。
5. 按 `manifest.chunks` 顺序加载 `chunks/*.json`。
6. 按 `manifest.bridgePaths` 加载 `bridges/*.json`。
7. 每加载一片就合并数据并更新 `graphData`。
8. `NolebaseGraphView3D` 通过 `watch(graphData)` 重新喂给 `3d-force-graph`。

默认静态资源根路径：

```text
/graph-data/gravity-matrix/
```

## 图谱展示策略

`NolebaseGraphView3D` 仍兼容普通 `GraphViewData`，同时会读取增强边字段：

- `weight` 用于调整 link distance、link strength、link width 和粒子宽度。
- `relationTypes` 用于区分语义关联和显式链接的颜色。
- `loading` 和 `progressLabel` 用于展示分片加载进度。
- `onNodeHover` 和 `onNodeDrag` 用于维护图谱焦点：悬停或拖动节点时，非相关节点和非相关边隐藏，相关节点、相关边和当前拖动节点突出显示。
- 聚焦状态下通过 `nodeThreeObject` 扩展节点对象：当前节点和每个直接相关节点会在各自节点位置显示标题贴标，而不是只在鼠标 tooltip 或侧边面板中显示标题。
- `nodeLabel` 仍保留为辅助 HTML tooltip，用于显示当前节点或相关节点的关系类型与连接强度。
- 关系说明面板会根据当前聚焦节点展示强关联边、边权重和关系类型，帮助读者理解为什么节点被连接。

### Three examples import 修复记录

曾尝试通过 Three 的 CSS2D object 在 3D 场景中渲染节点标题，但当前应用依赖树没有直接暴露 Three examples 里的 CSS2D renderer 模块，Vite 会报错：

```text
Failed to resolve the Three examples CSS2D renderer import
```

最终修复方式：移除对 `three/examples` 的直接导入，使用 `three-spritetext` 生成贴在节点上的文字 Sprite，并配合 `3d-force-graph` 原生 `nodeLabel` 回调返回 HTML 字符串作为辅助 tooltip。这样不依赖 Three examples 的内部包路径，同时能在鼠标聚焦时把相关节点标题分别显示在各自节点上。

页面文案已从“站点文档”调整为“站点笔记”，更贴合当前输入范围。

## 构建接入

新增脚本：

```bash
pnpm graph:matrix
```

构建接入：

- `prebuild` 会先运行 workspace build，再运行 `graph:matrix`。
- `build:test` 会先运行 workspace build，再运行 `graph:matrix`，最后执行测试构建脚本。

## 验证记录

已执行并通过：

```bash
pnpm graph:matrix
pnpm --filter @knewbeing/vitepress-plugin-graph-view test
node_modules/.bin/vitepress build
```

测试结果：

- 图谱插件源码测试文件：2 个通过
- 测试用例：7 个通过
- 目标实现文件编辑器诊断：无错误
- VitePress 站点构建通过；构建中仍有 UnoCSS 图标加载和 Rolldown pure annotation 警告，但不阻塞产物生成。
- 已通过静态构建预览 `http://127.0.0.1:5180/graph-view/` 做 Playwright 页面验收：图谱组件和 canvas 正常加载，悬停节点后出现关系面板和节点 tooltip，关系面板展示相关节点标题、关系类型和连接强度。
- 页面验收时未出现运行时错误；反复刷新 3D canvas 时浏览器可能打印 WebGL context lost 警告，属于调试刷新导致的上下文释放，不影响图谱交互。
- 图谱页已移除图谱容器外的贡献者、页面历史和残留 heading anchor 文本，避免干扰引力矩阵首屏体验。

已校验生成数据：

- `manifest.totalNodes` 与所有 chunk 节点数一致。
- `manifest.totalEdges` 等于 chunk 内边数与 bridge 边数之和。
- 旧的 `/graph-view/gravity-matrix/` 误生成路径已清空。
- 已执行 AI 生成尝试：`GRAVITY_MATRIX_AI=1 pnpm graph:matrix` 在当前环境未提供 AI API key 时按设计回退到本地相似度算法，并成功生成 367 个节点、4099 条边；设置上述 AI 环境变量后会生成包含 `ai-embedding` 关系来源的矩阵。

## 当前限制

- `node_modules/.bin/vitepress build` 可以稳定生成站点产物；当前环境中 `pnpm exec vitepress dev/serve` 曾出现无输出且未监听端口的情况，因此本轮页面验收改用 `.vitepress/dist` 加 Python 静态服务预览。
- 站点构建仍会打印若干非阻塞警告，包括 UnoCSS 图标加载失败、`@vueuse/core` pure annotation 位置警告和 chunk size 警告；这些警告不影响本轮引力矩阵图谱页面验收。

## 后续计划

1. 给 `scripts/generate-gravity-matrix.ts` 增加脚本级 fixture 测试，覆盖相关性计算和分片统计。
2. 为 `/graph-view/` 增加更明确的加载失败重试按钮。
3. 增加节点搜索、按分类筛选和点击节点后加载邻域增强数据。
4. 将 `.vitepress/theme/components/PageGraphAside.vue` 从全量 `.vitepress/graph.data` 迁移为按当前页面加载邻域 chunk。
5. 评估是否加入可选 embedding 缓存，以提升语义相关性质量，但不作为第一版依赖。
