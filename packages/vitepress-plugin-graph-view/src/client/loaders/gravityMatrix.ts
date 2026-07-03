import type { GraphViewData, GraphViewEdge, GraphViewNode, GravityMatrixChunk, GravityMatrixManifest } from '../../vitepress'

export interface GravityMatrixLoadProgress {
  loadedChunks: number
  totalChunks: number
  loadedNodes: number
  loadedEdges: number
  currentChunk?: string
}

export interface GravityMatrixLoadResult {
  data: GraphViewData
  manifest: GravityMatrixManifest
}

export interface GravityMatrixLoadOptions {
  base?: string
  rootPath?: string
  signal?: AbortSignal
  onProgress?: (progress: GravityMatrixLoadProgress) => void
  onData?: (data: GraphViewData) => void
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, '')
}

function buildAssetUrl(base = '/', rootPath = 'graph-data/gravity-matrix', path = 'manifest.json'): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${trimSlashes(rootPath)}/${trimSlashes(path)}`.replace(/([^:]\/)\/+/g, '$1')
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok)
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)

  return await response.json() as T
}

function edgeKey(edge: GraphViewEdge): string {
  const relationKey = edge.relationTypes?.join(',') || edge.type
  return `${edge.source}->${edge.target}:${relationKey}`
}

function mergeGraphData(target: GraphViewData, chunk: Pick<GravityMatrixChunk, 'nodes' | 'edges'>): GraphViewData {
  const nodes = new Map<string, GraphViewNode>(target.nodes.map(node => [node.id, node]))
  const edges = new Map<string, GraphViewEdge>(target.edges.map(edge => [edgeKey(edge), edge]))

  for (const node of chunk.nodes)
    nodes.set(node.id, node)

  for (const edge of chunk.edges)
    edges.set(edgeKey(edge), edge)

  return {
    nodes: [...nodes.values()],
    edges: [...edges.values()],
    generatedAt: target.generatedAt,
  }
}

export async function loadGravityMatrixGraph(options: GravityMatrixLoadOptions = {}): Promise<GravityMatrixLoadResult> {
  const manifest = await fetchJson<GravityMatrixManifest>(
    buildAssetUrl(options.base, options.rootPath, 'manifest.json'),
    options.signal,
  )
  let data: GraphViewData = {
    nodes: [],
    edges: [],
    generatedAt: manifest.generatedAt,
  }

  const reportProgress = (loadedChunks: number, currentChunk?: string) => {
    options.onProgress?.({
      loadedChunks,
      totalChunks: manifest.chunks.length,
      loadedNodes: data.nodes.length,
      loadedEdges: data.edges.length,
      currentChunk,
    })
  }

  reportProgress(0)
  options.onData?.(data)

  for (const [index, chunkInfo] of manifest.chunks.entries()) {
    const chunk = await fetchJson<GravityMatrixChunk>(
      buildAssetUrl(options.base, options.rootPath, chunkInfo.path),
      options.signal,
    )
    data = mergeGraphData(data, chunk)
    options.onData?.(data)
    reportProgress(index + 1, chunkInfo.id)
  }

  const bridgePaths = manifest.bridgePaths || (manifest.bridgesPath ? [manifest.bridgesPath] : [])
  for (const bridgePath of bridgePaths) {
    const bridges = await fetchJson<Pick<GravityMatrixChunk, 'nodes' | 'edges'>>(
      buildAssetUrl(options.base, options.rootPath, bridgePath),
      options.signal,
    )
    data = mergeGraphData(data, bridges)
    options.onData?.(data)
    reportProgress(manifest.chunks.length, bridgePath)
  }

  return { data, manifest }
}
