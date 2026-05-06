import { describe, expect, it } from 'vitest'

import type { GraphViewData } from './graph'

import { resolveGraphLinkTarget } from './graph'

describe('graph view link resolver', () => {
  const pages = [
    { id: '/foo.html', title: 'Foo', url: '/foo.html', filePath: 'foo.md', absolutePath: '/repo/foo.md', rawContent: '' },
    { id: '/bar/index.html', title: 'Bar', url: '/bar/index.html', filePath: 'bar/index.md', absolutePath: '/repo/bar/index.md', rawContent: '' },
  ]
  const byUrl = new Map(pages.map(page => [page.url, page]))
  const byFilePath = new Map(pages.map(page => [page.filePath, page]))
  const byStem = new Map<string, typeof pages>([
    ['foo', [pages[0]]],
    ['bar/index', [pages[1]]],
    ['index', [pages[1]]],
  ])

  it('resolves relative markdown links', () => {
    const target = resolveGraphLinkTarget('./bar/index.md', pages[0], { byUrl, byFilePath, byStem }, false)

    expect(target?.id).toBe('/bar/index.html')
  })

  it('resolves wikilinks by unique stem', () => {
    const target = resolveGraphLinkTarget('foo', pages[1], { byUrl, byFilePath, byStem }, false)

    expect(target?.id).toBe('/foo.html')
  })

  it('skips external links by default', () => {
    const target = resolveGraphLinkTarget('https://example.com', pages[0], { byUrl, byFilePath, byStem }, false)

    expect(target).toBeUndefined()
  })

  it('creates external nodes when enabled', () => {
    const target = resolveGraphLinkTarget('https://example.com/docs', pages[0], { byUrl, byFilePath, byStem }, true)

    expect(target).toMatchObject({ id: 'https://example.com/docs', external: true })
  })

  it('keeps graph data shape explicit', () => {
    const data: GraphViewData = { nodes: pages, edges: [], generatedAt: 0 }

    expect(data.nodes).toHaveLength(2)
  })
})
