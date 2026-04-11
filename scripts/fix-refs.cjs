const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE = path.join('zh-CN', '笔记');

// Find all md files (non-index) in new structure
function findMdFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findMdFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md')
      results.push(full);
  }
  return results;
}

// Find all files recursively
function findAllFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findAllFiles(full));
    else if (entry.isFile()) results.push(full);
  }
  return results;
}

// Build index of ALL non-md files by basename
const allFiles = findAllFiles(BASE);
const assetIndex = new Map(); // basename -> [full paths]
for (const f of allFiles) {
  if (!f.endsWith('.md')) {
    const bn = path.basename(f);
    if (!assetIndex.has(bn)) assetIndex.set(bn, []);
    assetIndex.get(bn).push(f);
  }
}

const mdFiles = findMdFiles(BASE);
let totalBroken = 0;
let totalFixed = 0;
const unfixable = [];

for (const mf of mdFiles) {
  const content = fs.readFileSync(mf, 'utf-8');
  const mdDir = path.dirname(mf);
  
  // Find all relative asset references
  // Patterns: ![...](./path), ![...](../path), src="./path", url(./path)
  const refPattern = /(!?\[.*?\]\()(\.\/?[^)]+\.(png|jpg|jpeg|gif|mp4|svg|webp|css|js))(\))/g;
  const refPattern2 = /(!?\[.*?\]\()(\.\.\/?[^)]+\.(png|jpg|jpeg|gif|mp4|svg|webp|css|js))(\))/g;
  
  let match;
  let newContent = content;
  let broken = [];
  
  // Check all relative references
  const allRefs = [];
  const combined = /(!?\[[^\]]*\]\()([.][./][^)]+\.(png|jpg|jpeg|gif|mp4|svg|webp|css|js))(\))/g;
  while ((match = combined.exec(content)) !== null) {
    const refPath = match[2];
    const fullRef = path.resolve(mdDir, refPath);
    if (!fs.existsSync(fullRef)) {
      allRefs.push({ full: match[0], prefix: match[1], refPath: match[2], suffix: match[4], basename: path.basename(refPath) });
    }
  }
  
  // Also check raw img src references
  const imgSrc = /src=["']([.][./][^"']+\.(png|jpg|jpeg|gif|mp4|svg|webp))["']/g;
  while ((match = imgSrc.exec(content)) !== null) {
    const refPath = match[1];
    const fullRef = path.resolve(mdDir, refPath);
    if (!fs.existsSync(fullRef)) {
      allRefs.push({ full: match[0], refPath: match[1], basename: path.basename(refPath), isImgSrc: true });
    }
  }
  
  if (allRefs.length === 0) continue;
  
  totalBroken += allRefs.length;
  
  for (const ref of allRefs) {
    const bn = ref.basename;
    const sources = assetIndex.get(bn);
    
    if (sources && sources.length > 0) {
      // Asset exists somewhere, move it to current md's directory
      const src = sources[0];
      const dest = path.join(mdDir, bn);
      
      if (!fs.existsSync(dest)) {
        try {
          // Copy (not move, since multiple md files might reference same asset)
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(src, dest);
          totalFixed++;
        } catch (e) {
          unfixable.push(`${path.relative(BASE, mf)}: ${ref.refPath} (copy failed: ${e.message})`);
          continue;
        }
      } else {
        totalFixed++;
      }
      
      // Update reference in md to just ./basename
      if (ref.isImgSrc) {
        newContent = newContent.replace(ref.full, `src="./${bn}"`);
      } else {
        newContent = newContent.replace(ref.full, `${ref.prefix}./${bn}${ref.suffix}`);
      }
    } else {
      unfixable.push(`${path.relative(BASE, mf)}: ${ref.refPath} (asset not found anywhere)`);
    }
  }
  
  if (newContent !== content) {
    fs.writeFileSync(mf, newContent, 'utf-8');
  }
}

console.log(`Broken references found: ${totalBroken}`);
console.log(`Fixed: ${totalFixed}`);
if (unfixable.length) {
  console.log(`\nUnfixable (${unfixable.length}):`);
  unfixable.forEach(u => console.log(`  ${u}`));
}
