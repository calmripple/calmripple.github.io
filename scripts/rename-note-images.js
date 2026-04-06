/*
 * Rename local image files referenced by markdown notes to concise sequential names
 * and update links in markdown files.
 *
 * Scope: zh-CN/笔记 (all nested .md files)
 * Naming: img-001.ext, img-002.ext, ... (per markdown file in appearance order)
 */

import fs from 'node:fs'
import path from 'node:path'

const NOTES_ROOT = path.resolve(process.cwd(), 'zh-CN/笔记')
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico', '.tif', '.tiff'])

const globalRenamedMap = new Map()

function walkMarkdownFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkMarkdownFiles(full, out)
      continue
    }
    if (entry.isFile() && full.endsWith('.md')) {
      out.push(full)
    }
  }
  return out
}

function isLocalPathLike(raw) {
  const p = raw.trim()
  if (!p)
    return false
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('//'))
    return false
  if (p.startsWith('data:') || p.startsWith('mailto:') || p.startsWith('#'))
    return false
  if (p.startsWith('/'))
    return false
  return true
}

function splitSuffix(url) {
  const q = url.indexOf('?')
  const h = url.indexOf('#')
  let cut = -1
  if (q >= 0 && h >= 0)
    cut = Math.min(q, h)
  else
    cut = Math.max(q, h)
  if (cut < 0)
    return { base: url, suffix: '' }
  return { base: url.slice(0, cut), suffix: url.slice(cut) }
}

function normalizeSeparators(p) {
  return p.replace(/\\/g, '/')
}

function parseMdDestination(dest) {
  const trimmed = dest.trim()
  if (!trimmed)
    return null

  if (trimmed.startsWith('<')) {
    const end = trimmed.indexOf('>')
    if (end > 0) {
      const rawPath = trimmed.slice(1, end)
      const remainder = trimmed.slice(end + 1)
      return {
        rawPath,
        rebuild(newPath) {
          return `<${newPath}>${remainder}`
        },
      }
    }
  }

  const m = trimmed.match(/^([^\s)]+)([\s\S]*)$/)
  if (!m)
    return null

  return {
    rawPath: m[1],
    rebuild(newPath) {
      return `${newPath}${m[2]}`
    },
  }
}

function nextAvailablePath(dir, preferredName) {
  const parsed = path.parse(preferredName)
  let candidate = path.join(dir, preferredName)
  if (!fs.existsSync(candidate))
    return candidate

  let i = 2
  while (true) {
    candidate = path.join(dir, `${parsed.name}-${i}${parsed.ext}`)
    if (!fs.existsSync(candidate))
      return candidate
    i++
  }
}

function renameOrReuse(sourceAbs, mdDir, counterObj) {
  const known = globalRenamedMap.get(sourceAbs)
  if (known) {
    const rel = normalizeSeparators(path.relative(mdDir, known))
    return rel.startsWith('.') ? rel : `./${rel}`
  }

  const ext = path.extname(sourceAbs).toLowerCase()
  counterObj.value += 1
  const name = `img-${String(counterObj.value).padStart(3, '0')}${ext}`
  const targetAbs = nextAvailablePath(path.dirname(sourceAbs), name)

  if (sourceAbs !== targetAbs)
    fs.renameSync(sourceAbs, targetAbs)

  globalRenamedMap.set(sourceAbs, targetAbs)

  const rel = normalizeSeparators(path.relative(mdDir, targetAbs))
  return rel.startsWith('.') ? rel : `./${rel}`
}

function processMarkdown(mdFile) {
  const mdDir = path.dirname(mdFile)
  const raw = fs.readFileSync(mdFile, 'utf8')
  let changed = false
  const localMap = new Map()
  const counter = { value: 0 }

  const pattern = /!\[([^\]]*)\]\(([^)]+)\)|<img\b[^>]*\bsrc=(['"])([^'"]+)\3[^>]*>/g

  const updated = raw.replace(pattern, (full, alt, mdDest, quote, htmlSrc) => {
    const isMarkdownImage = typeof mdDest === 'string' && mdDest.length > 0

    if (isMarkdownImage) {
      const parsed = parseMdDestination(mdDest)
      if (!parsed)
        return full

      const { rawPath } = parsed
      if (!isLocalPathLike(rawPath))
        return full

      const { base, suffix } = splitSuffix(rawPath)
      const decoded = decodeURIComponent(base)
      const sourceAbs = path.resolve(mdDir, decoded)
      const ext = path.extname(sourceAbs).toLowerCase()

      if (!IMAGE_EXTS.has(ext) || !fs.existsSync(sourceAbs) || !fs.statSync(sourceAbs).isFile())
        return full

      let replacementPath = localMap.get(sourceAbs)
      if (!replacementPath) {
        replacementPath = renameOrReuse(sourceAbs, mdDir, counter)
        localMap.set(sourceAbs, replacementPath)
      }

      const finalPath = `${replacementPath}${suffix}`
      const newDest = parsed.rebuild(finalPath)
      const result = `![${alt}](${newDest})`
      if (result !== full)
        changed = true
      return result
    }

    const src = htmlSrc
    if (!isLocalPathLike(src))
      return full

    const { base, suffix } = splitSuffix(src)
    const decoded = decodeURIComponent(base)
    const sourceAbs = path.resolve(mdDir, decoded)
    const ext = path.extname(sourceAbs).toLowerCase()
    if (!IMAGE_EXTS.has(ext) || !fs.existsSync(sourceAbs) || !fs.statSync(sourceAbs).isFile())
      return full

    let replacementPath = localMap.get(sourceAbs)
    if (!replacementPath) {
      replacementPath = renameOrReuse(sourceAbs, mdDir, counter)
      localMap.set(sourceAbs, replacementPath)
    }

    const finalPath = `${replacementPath}${suffix}`
    const result = full.replace(src, finalPath)
    if (result !== full)
      changed = true
    return result
  })

  if (changed)
    fs.writeFileSync(mdFile, updated, 'utf8')

  return changed
}

function main() {
  const files = walkMarkdownFiles(NOTES_ROOT)
  let changedMd = 0

  for (const file of files) {
    if (processMarkdown(file))
      changedMd += 1
  }

  console.log(`Done. Markdown files scanned: ${files.length}`)
  console.log(`Done. Markdown files updated: ${changedMd}`)
  console.log(`Done. Images renamed: ${globalRenamedMap.size}`)
}

main()
