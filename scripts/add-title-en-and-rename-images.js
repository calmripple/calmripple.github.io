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
    .replace(/['’`]/g, '')
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

function nextAvailablePath(dir, preferredName, sourceAbs = '') {
  const parsed = path.parse(preferredName)
  let candidate = path.join(dir, preferredName)
  if (!fs.existsSync(candidate))
    return candidate

  if (sourceAbs && path.resolve(candidate) === path.resolve(sourceAbs))
    return candidate

  let i = 2
  while (true) {
    candidate = path.join(dir, `${parsed.name}-${i}${parsed.ext}`)
    if (!fs.existsSync(candidate))
      return candidate
    if (sourceAbs && path.resolve(candidate) === path.resolve(sourceAbs))
      return candidate
    i += 1
  }
}

function buildRelative(fromDir, toAbs) {
  const rel = normalizeSeparators(path.relative(fromDir, toAbs))
  return rel.startsWith('.') ? rel : `./${rel}`
}

function rewriteImageRefs(content, mdFile, options) {
  const mdDir = path.dirname(mdFile)
  const { renameMap, enableRename, prefix } = options
  const localMap = new Map()
  const counter = { value: 0 }
  let changed = false

  const pattern = /!\[([^\]]*)\]\(([^)]+)\)|<img\b[^>]*\bsrc=(['"])([^'"]+)\3[^>]*>/g

  const output = content.replace(pattern, (full, alt, mdDest, _q, htmlSrc) => {
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

    let targetAbs = renameMap.get(sourceAbs)

    if (!targetAbs && enableRename) {
      targetAbs = localMap.get(sourceAbs)
      if (!targetAbs) {
        counter.value += 1
        const num = String(counter.value).padStart(3, '0')
        const preferred = `${prefix}-${num}${ext}`
        targetAbs = nextAvailablePath(path.dirname(sourceAbs), preferred, sourceAbs)
        if (sourceAbs !== targetAbs)
          fs.renameSync(sourceAbs, targetAbs)
        localMap.set(sourceAbs, targetAbs)
        renameMap.set(sourceAbs, targetAbs)
      }
    }

    if (!targetAbs)
      return full

    const relPath = buildRelative(mdDir, targetAbs)
    const finalPath = `${relPath}${suffix}`

    if (isMd) {
      const rebuilt = parsedDest.rebuild(finalPath)
      const next = `![${alt}](${rebuilt})`
      if (next !== full)
        changed = true
      return next
    }

    const next = full.replace(srcValue, finalPath)
    if (next !== full)
      changed = true
    return next
  })

  return { content: output, changed }
}

function main() {
  const allMd = walkMarkdownFiles(NOTES_ROOT)
  const renameMap = new Map()

  let touchedTitleEn = 0
  let updatedChineseMd = 0
  let renamedImages = 0

  for (const mdFile of allMd) {
    if (!isChineseFilename(mdFile))
      continue

    const stem = path.parse(mdFile).name
    const raw = fs.readFileSync(mdFile, 'utf8')
    const parsed = matter(raw)
    const data = parsed.data || {}

    let titleEn = typeof data['title-en'] === 'string' ? data['title-en'].trim() : ''
    let addedTitleEnForCurrentFile = false
    if (!titleEn) {
      titleEn = buildTitleEnFromFilename(stem)
      data['title-en'] = titleEn
      touchedTitleEn += 1
      addedTitleEnForCurrentFile = true
    }

    const prefix = slugify(titleEn) || buildTitleEnFromFilename(stem)
    const beforeRenameCount = renameMap.size
    const rewritten = rewriteImageRefs(parsed.content, mdFile, {
      renameMap,
      enableRename: true,
      prefix,
    })
    renamedImages += (renameMap.size - beforeRenameCount)

    const contentChanged = rewritten.changed

    if (contentChanged || addedTitleEnForCurrentFile) {
      const out = matter.stringify(rewritten.content, data)
      if (out !== raw) {
        fs.writeFileSync(mdFile, out, 'utf8')
        updatedChineseMd += 1
      }
    }
  }

  let backfillUpdated = 0
  if (renameMap.size > 0) {
    for (const mdFile of allMd) {
      const raw = fs.readFileSync(mdFile, 'utf8')
      const parsed = matter(raw)
      const rewritten = rewriteImageRefs(parsed.content, mdFile, {
        renameMap,
        enableRename: false,
        prefix: 'unused',
      })

      if (!rewritten.changed)
        continue

      const out = matter.stringify(rewritten.content, parsed.data || {})
      if (out !== raw) {
        fs.writeFileSync(mdFile, out, 'utf8')
        backfillUpdated += 1
      }
    }
  }

  console.log(`Done. Markdown files scanned: ${allMd.length}`)
  console.log(`Done. title-en added: ${touchedTitleEn}`)
  console.log(`Done. Chinese markdown files updated: ${updatedChineseMd}`)
  console.log(`Done. Images renamed: ${renamedImages}`)
  console.log(`Done. Backfill markdown updates: ${backfillUpdated}`)
}

main()
