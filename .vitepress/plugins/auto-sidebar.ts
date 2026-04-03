import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { DefaultTheme } from 'vitepress'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import GrayMatter from 'gray-matter'

export interface SidebarTarget {
  folderName: string
  separate?: boolean
}

interface DirectoryPageChild {
  text: string
  link: string
}

interface DirectoryPageMeta {
  route: string
  title: string
  children: DirectoryPageChild[]
}

interface VirtualIndexPluginOptions {
  srcDir: string
  targets: SidebarTarget[]
  base?: string
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  }
  catch {
    return false
  }
}

function parseFm(filePath: string): Record<string, any> {
  try {
    return GrayMatter(readFileSync(filePath, 'utf-8')).data ?? {}
  }
  catch {
    return {}
  }
}

function extractH1(content: string): string {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? ''
}

function titleFromMd(filePath: string, fallback: string): string {
  try {
    const { data, content } = GrayMatter(readFileSync(filePath, 'utf-8'))
    return data.sidebarTitle || data.title || extractH1(content) || fallback
  }
  catch {
    return fallback
  }
}

function titleFromDir(dirPath: string): string {
  for (const hint of ['index.md', '_page.md']) {
    const p = join(dirPath, hint)
    if (!existsSync(p))
      continue
    const t = titleFromMd(p, '')
    if (t && t !== 'index')
      return t
  }
  return basename(dirPath)
}

function isHiddenFromSidebar(filePath: string): boolean {
  return parseFm(filePath).sidebarHide === true
}

function getCollapsed(dirPath: string): boolean {
  for (const hint of ['index.md', '_page.md']) {
    const p = join(dirPath, hint)
    if (!existsSync(p))
      continue
    const fm = parseFm(p)
    if (fm.sidebarCollapsed != null)
      return Boolean(fm.sidebarCollapsed)
  }
  return true
}

function hasMdContent(dirPath: string): boolean {
  for (const entry of readdirSync(dirPath)) {
    if (entry.startsWith('_') || entry.startsWith('.'))
      continue
    const full = join(dirPath, entry)
    if (isDir(full) && hasMdContent(full))
      return true
    if (entry.endsWith('.md') && entry !== 'index.md')
      return true
  }
  return false
}

function urlForDir(srcDir: string, dirPath: string): string {
  return `/${relative(srcDir, dirPath).replace(/\\/g, '/')}/`
}

function urlForFile(srcDir: string, filePath: string): string {
  return `/${relative(srcDir, filePath).replace(/\.md$/, '').replace(/\\/g, '/')}`
}

function normalizeBase(base?: string): string {
  if (!base)
    return ''
  const trimmed = base.trim()
  if (!trimmed || trimmed === '/')
    return ''
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading
}

function withBase(base: string, route: string): string {
  return base ? `${base}${route}` : route
}

function stripBase(pathname: string, base: string): string {
  if (!base)
    return pathname
  if (pathname === base)
    return '/'
  if (pathname.startsWith(`${base}/`))
    return pathname.slice(base.length)
  return pathname
}

function toAssetFileName(route: string): string {
  const normalized = route.replace(/^\//, '')
  if (!normalized)
    return 'index.html'
  return normalized.endsWith('/') ? `${normalized}index.html` : `${normalized}/index.html`
}

function sortByText<T extends { text?: string }>(items: T[]): T[] {
  return items.sort((a, b) => (a.text ?? '').localeCompare(b.text ?? '', 'zh-CN'))
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderVirtualDirectoryHtml(title: string, children: DirectoryPageChild[], base: string): string {
  const links = children.length
    ? children.map(child => `      <li><a href="${escapeHtml(withBase(base, child.link))}">${escapeHtml(child.text)}</a></li>`).join('\n')
    : '      <li>此目录暂无可展示内容</li>'

  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeHtml(title)}</title>`,
    '  <style>',
    '    :root { color-scheme: light; }',
    '    body { margin: 0; font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif; background: #f6f8fa; color: #1f2328; }',
    '    .wrap { max-width: 960px; margin: 0 auto; padding: 36px 20px 72px; }',
    '    h1 { margin: 0 0 18px; font-size: 28px; }',
    '    p { margin: 0 0 16px; color: #59636e; }',
    '    ul { margin: 0; padding-left: 22px; }',
    '    li { margin: 8px 0; }',
    '    a { color: #0969da; text-decoration: none; }',
    '    a:hover { text-decoration: underline; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <main class="wrap">',
    `    <h1>${escapeHtml(title)}</h1>`,
    '    <p>这是自动生成的目录索引页（虚拟，不写入源码目录）。</p>',
    '    <ul>',
    links,
    '    </ul>',
    '  </main>',
    '</body>',
    '</html>',
    '',
  ].join('\n')
}

function collectDirectoryPageChildren(dirPath: string, srcDir: string): DirectoryPageChild[] {
  const dirs: DirectoryPageChild[] = []
  const files: DirectoryPageChild[] = []

  for (const entry of readdirSync(dirPath).sort()) {
    if (entry.startsWith('_') || entry.startsWith('.') || entry === 'index.md')
      continue

    const full = join(dirPath, entry)
    if (isDir(full)) {
      if (!hasMdContent(full))
        continue
      dirs.push({
        text: titleFromDir(full),
        link: urlForDir(srcDir, full),
      })
    }
    else if (entry.endsWith('.md')) {
      if (isHiddenFromSidebar(full))
        continue
      files.push({
        text: titleFromMd(full, entry.replace(/\.md$/, '')),
        link: urlForFile(srcDir, full),
      })
    }
  }

  return [...sortByText(dirs), ...sortByText(files)]
}

function collectVirtualDirectoryPages(srcDir: string, targets: SidebarTarget[]): Map<string, DirectoryPageMeta> {
  const pages = new Map<string, DirectoryPageMeta>()

  const visit = (dir: string) => {
    const hasIndex = existsSync(join(dir, 'index.md'))

    if (!hasIndex && hasMdContent(dir)) {
      const route = urlForDir(srcDir, dir)
      pages.set(route, {
        route,
        title: titleFromDir(dir),
        children: collectDirectoryPageChildren(dir, srcDir),
      })
    }

    for (const entry of readdirSync(dir)) {
      if (entry.startsWith('_') || entry.startsWith('.'))
        continue
      const child = join(dir, entry)
      if (isDir(child))
        visit(child)
    }
  }

  for (const target of targets) {
    const abs = join(srcDir, target.folderName)
    if (isDir(abs))
      visit(abs)
  }

  return pages
}

function sendHtml(res: ServerResponse<IncomingMessage>, html: string): void {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(html)
}

function redirectToTrailingSlash(res: ServerResponse<IncomingMessage>, location: string): void {
  res.statusCode = 302
  res.setHeader('Location', location)
  res.end()
}

export function createAutoSidebarVirtualIndexPlugin(options: VirtualIndexPluginOptions): Plugin {
  const normalizedBase = normalizeBase(options.base)
  const pages = collectVirtualDirectoryPages(options.srcDir, options.targets)

  return {
    name: 'auto-sidebar-virtual-index',

    // DEV: serve virtual directory index pages via middleware.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || req.method !== 'GET') {
          next()
          return
        }

        const url = new URL(req.url, 'http://localhost')
        let pathname = stripBase(url.pathname, normalizedBase)
        if (!pathname.startsWith('/'))
          pathname = `/${pathname}`

        // Only intercept directory requests (no extension, ends with /)
        // Never intercept .md/.js/.css/.json/.wasm/.ico/.svg/.png/.jpg/.jpeg/.gif/.webp/.woff2/.ttf/.map etc.
        if (/[.][a-zA-Z0-9]+$/.test(pathname)) {
          next()
          return
        }

        // Only redirect /xxx to /xxx/ if:
        // - /xxx is a directory (existsSync)
        // - /xxx.md does NOT exist
        if (!pathname.endsWith('/')) {
          const slashRoute = `${pathname}/`
          // Find the real fs path for this route
          const fsDir = join(options.srcDir, decodeURIComponent(pathname.slice(1)))
          const fsMd = fsDir + '.md'
          try {
            if (pages.has(slashRoute) && isDir(fsDir) && !existsSync(fsMd)) {
              const to = withBase(normalizedBase, slashRoute)
              redirectToTrailingSlash(res, to)
              return
            }
          } catch {}
          next()
          return
        }

        const page = pages.get(pathname)
        if (!page) {
          next()
          return
        }

        const accept = req.headers.accept ?? ''
        if (!accept.includes('text/html') && accept !== '*/*') {
          next()
          return
        }

        sendHtml(res, renderVirtualDirectoryHtml(page.title, page.children, normalizedBase))
      })
    },

    // BUILD: emit static index.html assets for virtual directory pages.
    generateBundle() {
      for (const page of pages.values()) {
        const fileName = toAssetFileName(page.route)
        this.emitFile({
          type: 'asset',
          fileName,
          source: renderVirtualDirectoryHtml(page.title, page.children, normalizedBase),
        })
      }
    },
  }
}

function buildDirNode(dirPath: string, srcDir: string): DefaultTheme.SidebarItem {
  const node: DefaultTheme.SidebarItem = {
    text: titleFromDir(dirPath),
    collapsed: getCollapsed(dirPath),
    items: [],
  }

  // 对于没有 index.md 的目录，也链接到目录路径，由虚拟索引页插件接管。
  if (hasMdContent(dirPath))
    node.link = urlForDir(srcDir, dirPath)

  const dirs: DefaultTheme.SidebarItem[] = []
  const files: DefaultTheme.SidebarItem[] = []

  for (const entry of readdirSync(dirPath).sort()) {
    if (entry.startsWith('_') || entry.startsWith('.') || entry === 'index.md')
      continue

    const full = join(dirPath, entry)

    if (isDir(full)) {
      if (hasMdContent(full))
        dirs.push(buildDirNode(full, srcDir))
    }
    else if (entry.endsWith('.md')) {
      if (isHiddenFromSidebar(full))
        continue
      files.push({
        text: titleFromMd(full, entry.replace(/\.md$/, '')),
        link: urlForFile(srcDir, full),
      })
    }
  }

  node.items = [
    ...sortByText(dirs),
    ...sortByText(files),
  ]

  return node
}

export function buildAutoSidebar(srcDir: string, targets: SidebarTarget[]): DefaultTheme.SidebarMulti {
  const result: DefaultTheme.SidebarMulti = {}
  const rootItems: DefaultTheme.SidebarItem[] = []

  for (const target of targets) {
    const abs = join(srcDir, target.folderName)
    if (!isDir(abs))
      continue

    const node = buildDirNode(abs, srcDir)
    rootItems.push(node)

    if (target.separate)
      result[urlForDir(srcDir, abs)] = node.items ?? []
  }

  result['/'] = rootItems
  return result
}
