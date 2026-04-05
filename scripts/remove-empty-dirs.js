/**
 * Recursively remove empty directories.
 * Runs after image consolidation to clean up now-empty image directories.
 */

import fs from 'node:fs'
import path from 'node:path'

const NOTES_ROOT = path.resolve(process.cwd(), 'zh-CN/笔记')

function removeEmptyDirs(dir) {
  let removed = 0

  function recurse(currentDir, depth = 0) {
    if (depth > 100) return // Prevent deep recursion issues

    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })

      // First recurse into subdirectories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subPath = path.join(currentDir, entry.name)
          recurse(subPath, depth + 1)
        }
      }

      // Then check if current dir is empty
      const afterRecurse = fs.readdirSync(currentDir)
      if (afterRecurse.length === 0 && currentDir !== NOTES_ROOT) {
        try {
          fs.rmdirSync(currentDir)
          removed++
        } catch {
          // Directory might not be empty or have permission issues
        }
      }
    } catch {
      // Ignore errors
    }
  }

  recurse(dir)
  return removed
}

function main() {
  const removed = removeEmptyDirs(NOTES_ROOT)
  console.log(`Done. Removed: ${removed} empty directories`)
}

main()
