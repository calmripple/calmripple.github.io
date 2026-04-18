// @ts-check
/// <reference types="node" />
/**
 * pnpm hook:
 * 1. 扫描 vitepress-plugin-blogs/ 下所有子目录，读取其 package.json 的 name 字段
 * 2. 若项目依赖里出现了同名包，则改写为 link: 本地路径
 * 3. 若本地目录不存在（例如未拉取子模块），跳过改写，保持原 npm 版本
 */
const { existsSync, readdirSync, readFileSync, statSync } = require('node:fs')
const { resolve, join } = require('node:path')

// vitepress-plugin-blogs 是与本仓库同级的独立 git 库
const PLUGINS_ROOT = resolve(__dirname, '..', 'vitepress-plugin-blogs', 'packages')

/**
 * @param {string} root
 * @returns {Record<string, string>}
 */
function scanLocalPackages(root) {
  /** @type {Record<string, string>} */
  const map = {}
  if (!existsSync(root))
    return map

  for (const entry of readdirSync(root)) {
    if (entry.startsWith('.') || entry === 'node_modules')
      continue

    const dir = join(root, entry)
    try {
      if (!statSync(dir).isDirectory())
        continue
    }
    catch { continue }

    const pkgPath = join(dir, 'package.json')
    if (!existsSync(pkgPath))
      continue

    try {
      /** @type {{ name?: string }} */
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      if (pkg.name)
        map[pkg.name] = dir
    }
    catch { /* ignore malformed package.json */ }
  }

  return map
}

const LOCAL_MAP = scanLocalPackages(PLUGINS_ROOT)

/**
 * @param {Record<string, string> | undefined} deps
 */
function rewrite(deps) {
  if (!deps)
    return
  for (const [name, dir] of Object.entries(LOCAL_MAP)) {
    if (deps[name])
      deps[name] = `link:${dir}`
  }
}

/**
 * @param {{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }} pkg
 */
function readPackage(pkg) {
  rewrite(pkg.dependencies)
  rewrite(pkg.devDependencies)
  return pkg
}

module.exports = { hooks: { readPackage } }

