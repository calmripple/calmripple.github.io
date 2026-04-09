#!/usr/bin/env node

/**
 * Verify Gemini API key and list usable models with generateContent endpoint URLs.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/verify-gemini-models.mjs
 *   GEMINI_API_KEY=your_key node scripts/verify-gemini-models.mjs --probe --max-probe=5
 *   GEMINI_API_KEY=your_key node scripts/verify-gemini-models.mjs --out=gemini-models.json
 *
 * Optional env:
 *   GEMINI_API_BASE=https://generativelanguage.googleapis.com/v1beta
 */

import fs from 'node:fs/promises'

const DEFAULT_BASE = 'https://generativelanguage.googleapis.com/v1beta'

function getArg(name) {
  const prefix = `${name}=`
  const found = process.argv.find(arg => arg.startsWith(prefix))
  return found ? found.slice(prefix.length) : undefined
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function usage() {
  console.log([
    'Gemini model verifier',
    '',
    'Required:',
    '  Set GEMINI_API_KEY in environment.',
    '',
    'Options:',
    '  --probe                Actively call generateContent to verify access.',
    '  --max-probe=N          Probe at most N models (default 5).',
    '  --out=FILE             Write full JSON output to a file.',
    '  --timeout-ms=MS        Request timeout in milliseconds (default 20000).',
  ].join('\n'))
}

async function fetchJson(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })

    const text = await res.text()
    let json
    try {
      json = text ? JSON.parse(text) : undefined
    }
    catch {
      json = { raw: text }
    }

    return { ok: res.ok, status: res.status, json }
  }
  finally {
    clearTimeout(timeout)
  }
}

function buildGenerateContentUrl(base, modelName) {
  const trimmedBase = base.replace(/\/$/, '')
  return `${trimmedBase}/${modelName}:generateContent`
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    usage()
    return 0
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim()
  const apiBase = process.env.GEMINI_API_BASE || DEFAULT_BASE
  const probe = hasFlag('--probe')
  const maxProbe = Number(getArg('--max-probe') || 5)
  const outPath = getArg('--out')
  const timeoutMs = Number(getArg('--timeout-ms') || 20000)

  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY. Export it as an environment variable first.')
    usage()
    return 1
  }

  // Gemini API keys are expected to start with AIza; catch obvious invalid input early.
  if (!apiKey.startsWith('AIza')) {
    console.error('GEMINI_API_KEY looks invalid: expected key prefix "AIza".')
    console.error('Please set the original plaintext API key instead of an encoded or truncated value.')
    return 1
  }

  const listUrl = `${apiBase.replace(/\/$/, '')}/models?key=${encodeURIComponent(apiKey)}`
  const listed = await fetchJson(listUrl, { method: 'GET' }, timeoutMs)

  if (!listed.ok) {
    console.error('Failed to list models.')
    console.error(JSON.stringify({ status: listed.status, error: listed.json }, null, 2))
    return 2
  }

  const models = Array.isArray(listed.json?.models) ? listed.json.models : []
  const genModels = models.filter((m) => {
    const methods = Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : []
    return methods.includes('generateContent')
  })

  const mapped = genModels.map((m) => {
    const name = m.name || ''
    const id = name.startsWith('models/') ? name.slice('models/'.length) : name
    return {
      id,
      name,
      displayName: m.displayName,
      description: m.description,
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
      generateContentUrl: buildGenerateContentUrl(apiBase, name),
      probe: probe ? { attempted: false, ok: false } : undefined,
    }
  })

  if (probe) {
    const probeTargets = mapped.slice(0, Math.max(0, maxProbe))
    for (const model of probeTargets) {
      const probeUrl = `${model.generateContentUrl}?key=${encodeURIComponent(apiKey)}`
      const payload = {
        contents: [
          {
            parts: [
              { text: 'ping' },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1,
        },
      }

      const probeResult = await fetchJson(probeUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, timeoutMs)

      model.probe = {
        attempted: true,
        ok: probeResult.ok,
        status: probeResult.status,
        error: probeResult.ok ? undefined : probeResult.json?.error || probeResult.json,
      }
    }
  }

  const output = {
    ok: true,
    apiBase,
    totalModels: models.length,
    generateContentModels: mapped.length,
    probed: probe ? Math.min(mapped.length, Math.max(0, maxProbe)) : 0,
    models: mapped,
  }

  if (outPath) {
    await fs.writeFile(outPath, JSON.stringify(output, null, 2), 'utf8')
    console.log(`Wrote model report to ${outPath}`)
  }

  console.log(JSON.stringify(output, null, 2))
  return 0
}

main()
  .then((code) => {
    if (typeof code === 'number' && code !== 0)
      process.exitCode = code
  })
  .catch((error) => {
    console.error('Unexpected failure:', error?.message || error)
    process.exitCode = 99
  })
