import { afterEach, describe, expect, it, vi } from 'vitest'

import { loadGravityMatrixGraph } from './gravityMatrix'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

describe('loadGravityMatrixGraph', () => {
  it('loads manifest, chunks and bridges with base path', async () => {
    const requestedUrls: string[] = []
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      requestedUrls.push(url)

      if (url === '/docs/graph-data/gravity-matrix/manifest.json') {
        return jsonResponse({
          version: 1,
          generatedAt: 123,
          totalNodes: 3,
          totalEdges: 2,
          chunkSizeTarget: 160,
          chunks: [
            { id: 'chunk-000', path: 'chunks/chunk-000.json', nodeCount: 2, edgeCount: 1, categories: ['A'] },
            { id: 'chunk-001', path: 'chunks/chunk-001.json', nodeCount: 1, edgeCount: 0, categories: ['B'] },
          ],
          bridgePaths: ['bridges/bridge-000.json'],
          nodeIndex: [],
        })
      }

      if (url === '/docs/graph-data/gravity-matrix/chunks/chunk-000.json') {
        return jsonResponse({
          version: 1,
          generatedAt: 123,
          id: 'chunk-000',
          nodes: [
            { id: 'a', title: 'A', url: '/a.html', filePath: 'a.md', chunkId: 'chunk-000' },
            { id: 'b', title: 'B', url: '/b.html', filePath: 'b.md', chunkId: 'chunk-000' },
          ],
          edges: [{ source: 'a', target: 'b', type: 'related', weight: 0.7, relationTypes: ['content-similarity'], scoreBreakdown: { 'content-similarity': 0.7 } }],
        })
      }

      if (url === '/docs/graph-data/gravity-matrix/chunks/chunk-001.json') {
        return jsonResponse({
          version: 1,
          generatedAt: 123,
          id: 'chunk-001',
          nodes: [{ id: 'c', title: 'C', url: '/c.html', filePath: 'c.md', chunkId: 'chunk-001' }],
          edges: [],
        })
      }

      if (url === '/docs/graph-data/gravity-matrix/bridges/bridge-000.json') {
        return jsonResponse({
          version: 1,
          generatedAt: 123,
          nodes: [],
          edges: [{ source: 'b', target: 'c', type: 'related', weight: 0.5, relationTypes: ['directory-neighbor'], scoreBreakdown: { 'directory-neighbor': 0.5 } }],
        })
      }

      return new Response('not found', { status: 404 })
    })

    const progressEvents: Array<{ loadedChunks: number, loadedNodes: number, loadedEdges: number }> = []
    const dataEvents: number[] = []

    const result = await loadGravityMatrixGraph({
      base: '/docs/',
      onData(data) {
        dataEvents.push(data.nodes.length)
      },
      onProgress(progress) {
        progressEvents.push({
          loadedChunks: progress.loadedChunks,
          loadedNodes: progress.loadedNodes,
          loadedEdges: progress.loadedEdges,
        })
      },
    })

    expect(requestedUrls).toEqual([
      '/docs/graph-data/gravity-matrix/manifest.json',
      '/docs/graph-data/gravity-matrix/chunks/chunk-000.json',
      '/docs/graph-data/gravity-matrix/chunks/chunk-001.json',
      '/docs/graph-data/gravity-matrix/bridges/bridge-000.json',
    ])
    expect(result.data.nodes).toHaveLength(3)
    expect(result.data.edges).toHaveLength(2)
    expect(result.data.generatedAt).toBe(123)
    expect(dataEvents).toEqual([0, 2, 3, 3])
    expect(progressEvents.at(-1)).toEqual({ loadedChunks: 2, loadedNodes: 3, loadedEdges: 2 })
  })

  it('throws when a chunk request fails', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('manifest.json')) {
        return jsonResponse({
          version: 1,
          generatedAt: 123,
          totalNodes: 1,
          totalEdges: 0,
          chunkSizeTarget: 160,
          chunks: [{ id: 'chunk-000', path: 'chunks/chunk-000.json', nodeCount: 1, edgeCount: 0, categories: [] }],
          nodeIndex: [],
        })
      }

      return new Response('missing', { status: 404, statusText: 'Missing' })
    })

    await expect(loadGravityMatrixGraph()).rejects.toThrow('Failed to load /graph-data/gravity-matrix/chunks/chunk-000.json: 404 Missing')
  })
})
