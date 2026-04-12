<!--
🔍 【中文注释】
  工具名称: 验证报告模板
  功能分类: 代码审查
  功能说明: 用于生成结构化验证报告模板，便于人工审查和结果归档。
  使用方式: 在 Copilot Chat 或审查流程中自动插入验证报告模板。
  关键标签: 报告模板、审查、结构化输出
-->

# Verification Report

## Summary

**Text verified:** [Brief description of what was checked]
**Claims extracted:** [N total]
**Breakdown:**

| Rating | Count |
|--------|-------|
| VERIFIED | |
| PLAUSIBLE | |
| UNVERIFIED | |
| DISPUTED | |
| FABRICATION RISK | |

**Items requiring attention:** [N items rated DISPUTED or FABRICATION RISK]

---

## Flagged Items (Review These First)

Items rated DISPUTED or FABRICATION RISK. These need your attention before you rely on the source material.

### [C#] -- [Brief description of the claim]

- **Claim:** [The specific assertion from the target text]
- **Rating:** [DISPUTED or FABRICATION RISK]
- **Finding:** [What the verification found -- what's wrong or suspicious]
- **Source:** [URL to contradicting or relevant source]
- **Recommendation:** [What the user should do -- e.g., "Verify this citation in Westlaw" or "Remove this statistic unless you can find a primary source"]

---

## All Claims

Full results for every extracted claim, grouped by confidence rating.

### VERIFIED

#### [C#] -- [Brief description]
- **Claim:** [The assertion]
- **Source:** [URL]
- **Notes:** [Any relevant context about the source]

### PLAUSIBLE

#### [C#] -- [Brief description]
- **Claim:** [The assertion]
- **Notes:** [Why this is rated plausible rather than verified]

### UNVERIFIED

#### [C#] -- [Brief description]
- **Claim:** [The assertion]
- **Notes:** [What was searched, why nothing was found]

### DISPUTED

#### [C#] -- [Brief description]
- **Claim:** [The assertion]
- **Contradicting source:** [URL]
- **Details:** [What the source says vs. what the claim says]

### FABRICATION RISK

#### [C#] -- [Brief description]
- **Claim:** [The assertion]
- **Pattern:** [Which hallucination pattern this matches]
- **Details:** [Why this is flagged -- e.g., "citation not found in any legal database"]

---

## Internal Consistency

[Any contradictions found within the target text itself, or "No internal contradictions detected."]

---

## What Was Not Checked

[List any claims that could not be evaluated -- paywalled sources, claims requiring specialized databases, unfalsifiable assertions, etc.]

---

## Limitations

- This tool accelerates human verification; it does not replace it.
- Web search results may not include the most recent information or paywalled sources.
- The adversarial review uses the same underlying model that may have produced the original output. It catches many issues but cannot catch all of them.
- A claim rated VERIFIED means a supporting source was found, not that the claim is definitely correct. Sources can be wrong too.
- Claims rated PLAUSIBLE may still be wrong. The absence of contradicting evidence is not proof of accuracy.
