/**
 * Clean up old image directories after consolidation.
 * Removes image files from non-assets directories within each markdown's folder.
 */

import fs from 'node:fs'
import path from 'node:path'

const NOTES_ROOT = path.resolve(process.cwd(), 'zh-CN/笔记')
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp', '.ico', '.tif', '.tiff'])

function walkDirs(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory())
      out.push(full)
    walkDirs(full, out)
  }
  return out
}

function cleanupImageDirs(dir) {
  let cleaned = 0
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    // Check if current dir contains only images (old pattern)
    const files = entries.filter(e => e.isFile())
    const imageFiles = files.filter(f => IMAGE_EXTS.has(path.extname(f.name).toLowerCase()))

    if (imageFiles.length > 0 && imageFiles.length === files.length) {
      // This dir has only images and no subdirs except assets
      const subdirs = entries.filter(e => e.isDirectory())
      const hasAssets = subdirs.some(d => d.name === 'assets')

      if (subdirs.every(d => d.name === 'assets')) {
        // Safe to delete all image files
        for (const f of imageFiles) {
          try {
            fs.unlinkSync(path.join(dir, f.name))
            cleaned++
          } catch {
            // ignore
          }
        }
      }
    }

    // Recurse into subdirs (except assets)
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'assets') {
        cleaned += cleanupImageDirs(path.join(dir, entry.name))
      }
    }
  } catch {
    // ignore
  }

  return cleaned
}

function main() {
  const cleaned = cleanupImageDirs(NOTES_ROOT)
  console.log(`Done. Cleaned up: ${cleaned} old image files`)
}

main()
