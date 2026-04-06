/**
 * Consolidate all local images to per-markdown assets/ directories.
 * Naming: md-filename-001.ext or title-en-001.ext (for Chinese filenames)
 * Updates all markdown references accordingly.
 */

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { pinyin } from 'pinyin-pro'

const NOTES_ROOT = path.resolve(process.cwd(), 'zh-CN/笔记')
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico', '.tif', '.tiff'])
const CHINESE_RE = /[\u3400-\u9fff]/

function walkMarkdownFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkMarkdownFiles(full, out)
      continue
    }
    if (entry.isFile() && full.endsWith('.md'))
      out.push(full)
  }
  return out
}

function isChineseFilename(mdPath) {
  return CHINESE_RE.test(path.parse(mdPath).name)
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildTitleEnFromFilename(name) {
  const tokens = pinyin(name, { toneType: 'none', type: 'array' })
  const raw = Array.isArray(tokens) ? tokens.join('-') : String(tokens || '')
  const normalized = slugify(raw)
  if (normalized)
    return normalized
  return `note-${Buffer.from(name).toString('hex').slice(0, 12)}`
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

function buildRelative(fromDir, toAbs) {
  const rel = normalizeSeparators(path.relative(fromDir, toAbs))
  return rel.startsWith('.') ? rel : `./${rel}`
}

function processMarkdown(mdFile) {
  const mdDir = path.dirname(mdFile)
  const mdName = path.parse(mdFile).name
  const assetsDir = path.join(mdDir, 'assets')
  const raw = fs.readFileSync(mdFile, 'utf8')
  const parsed = matter(raw)

  // Determine prefix
  let prefix = mdName
  if (isChineseFilename(mdFile)) {
    const titleEn = parsed.data?.['title-en']
    if (typeof titleEn === 'string')
      prefix = slugify(titleEn) || buildTitleEnFromFilename(mdName)
  }

  // Create assets directory if needed
  if (!fs.existsSync(assetsDir))
    fs.mkdirSync(assetsDir, { recursive: true })

  // Collect image refs and map to new ids
  const refMap = new Map() // oldPath -> { newPath, counter }
  let contentChanged = false
  const counter = { value: 0 }

  const pattern = /!\[([^\]]*)\]\(([^)]+)\)|<img\b[^>]*\bsrc=(['"])([^'"]+)\3[^>]*>/g

  const updated = parsed.content.replace(pattern, (full, alt, mdDest, _q, htmlSrc) => {
    const isMd = typeof mdDest === 'string' && mdDest.length > 0
    const rawUrl = isMd ? mdDest : htmlSrc
    if (!rawUrl)
      return full

    const parsedDest = isMd ? parseMdDestination(rawUrl) : null
    const srcValue = isMd ? parsedDest?.rawPath : rawUrl
    if (!srcValue || !isLocalPathLike(srcValue))
      return full

    const { base, suffix } = splitSuffix(srcValue)
    const decoded = decodeURIComponent(base)
    const sourceAbs = path.resolve(mdDir, decoded)
    const ext = path.extname(sourceAbs).toLowerCase()

    if (!IMAGE_EXTS.has(ext) || !fs.existsSync(sourceAbs) || !fs.statSync(sourceAbs).isFile())
      return full

    // Map source to target
    let mapped = refMap.get(sourceAbs)
    if (!mapped) {
      counter.value += 1
      const num = String(counter.value).padStart(3, '0')
      const newName = `${prefix}-${num}${ext}`
      const targetAbs = path.join(assetsDir, newName)

      // Move file
      if (sourceAbs !== targetAbs) {
        fs.copyFileSync(sourceAbs, targetAbs)
        // Don't delete yet; we'll do bulk cleanup later
      }

      const relPath = buildRelative(mdDir, targetAbs)
      mapped = { newPath: `${relPath}${suffix}`, sourceAbs }
      refMap.set(sourceAbs, mapped)
    }

    // Update reference
    if (isMd) {
      const rebuilt = parsedDest.rebuild(mapped.newPath)
      const next = `![${alt}](${rebuilt})`
      if (next !== full)
        contentChanged = true
      return next
    }

    const next = full.replace(srcValue, mapped.newPath)
    if (next !== full)
      contentChanged = true
    return next
  })

  // Write updated markdown if changed
  if (contentChanged) {
    const out = matter.stringify(updated, parsed.data || {})
    if (out !== raw)
      fs.writeFileSync(mdFile, out, 'utf8')
  }

  return { count: refMap.size, movedFiles: Array.from(refMap.values()) }
}

function main() {
  const allMd = walkMarkdownFiles(NOTES_ROOT)
  let totalMoved = 0
  let filesProcessed = 0
  let filesChanged = 0

  for (const mdFile of allMd) {
    const result = processMarkdown(mdFile)
    if (result.count > 0) {
      filesProcessed += 1
      filesChanged += 1
      totalMoved += result.count
    }
  }

  // Cleanup old image directories (empty or non-assets)
  function cleanupOldDirs(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'assets') {
          const children = fs.readdirSync(full)
          const hasImages = children.some(n => {
            const ext = path.extname(n).toLowerCase()
            return IMAGE_EXTS.has(ext)
          })
          if (hasImages && children.every(n => IMAGE_EXTS.has(path.extname(n).toLowerCase()))) {
            // This dir contains only images; check if safe to clear
            // For safety, we keep them for now
          }
        } else if (entry.isDirectory()) {
          cleanupOldDirs(full)
        }
      }
    } catch {
      // ignore
    }
  }

  cleanupOldDirs(NOTES_ROOT)

  console.log(`Done. Markdown files scanned: ${allMd.length}`)
  console.log(`Done. Markdown files with changes: ${filesChanged}`)
  console.log(`Done. Images consolidated: ${totalMoved}`)
}

main()
