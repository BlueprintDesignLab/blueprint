/* blueprint/contextBuilder.ts
   ------------------------------------------------------------
   Assumptions
   • Each node owns one main file + 0-N helper files.
   • One file per edge is optional (edge.main_file).
   • No prompt-size trimming for MVP.
*/

//////////////////// Types ///////////////////////////////////////////////////

export interface NodeDSL {
  id: string
  label: string
  main_file: string
  helper_files?: string[]
  comment?: string
}

export interface EdgeDSL {
  id: string
  label: string
  main_file?: string
  helper_files?: string[]
  comment?: string
  source: string
  target: string
  contract?: string
}

export interface GraphDSL {
  nodes: Record<string, NodeDSL>
  edges: Record<string, EdgeDSL>
}

//////////////////// Error helpers ///////////////////////////////////////////

export class GraphError extends Error {
  constructor(msg: string, public ctx?: any) { super(msg) }
}

//////////////////// File helpers (sync for brevity) /////////////////////////

import { readFileSync, existsSync } from 'fs'

function readFileSafe(path: string): string {
  if (!existsSync(path))
    throw new GraphError('File not found', { path })
  try {
    return readFileSync(path, 'utf8')
  } catch (e) {
    throw new GraphError('Cannot read file', { path, err: e })
  }
}

/* extract quick signature lines (no size cap) */
function signatures(src: string): string {
  return src
    .split('\n')
    .filter(l => /^(export|public|pub|def|class|interface|function)\b/.test(l))
    .join('\n')
}

//////////////////// Chat history (simple JSON per node) /////////////////////

import { readFileSync as rfs, writeFileSync as wfs } from 'fs'
const histPath = (id: string) => `.graphfs/nodes/${id}/history.json`

export function loadHistory(id: string): string[] {
  return existsSync(histPath(id)) ? JSON.parse(rfs(histPath(id), 'utf8')) : []
}
export function appendHistory(id: string, turn: string) {
  const h = [...loadHistory(id), turn]
  wfs(histPath(id), JSON.stringify(h, null, 2))
}

//////////////////// Neighbour lookup ////////////////////////////////////////

export function neighbours(graph: GraphDSL, nodeId: string): string[] {
  const out = new Set<string>()
  Object.values(graph.edges).forEach(e => {
    if (e.source === nodeId) out.add(e.target)
    if (e.target === nodeId) out.add(e.source)
  })
  return [...out]
}

//////////////////// Prompt builder //////////////////////////////////////////

export interface PromptOpts {
  graph: GraphDSL
  focus: string
  userMsg: string
  system: string
}

export function buildPrompt({ graph, focus, userMsg, system }: PromptOpts): string {
  const parts: string[] = []

  // 1. System
  parts.push(system)

  // 2. Graph overview
  const nodesOverview = Object.values(graph.nodes)
    .map(n => `${n.id}:${n.label}${n.comment ? ` // ${n.comment}` : ''}`)
    .join('\n')
  const edgesOverview = Object.values(graph.edges)
    .map(e => `${e.source}->${e.target} (${e.label})${e.comment ? ` // ${e.comment}` : ''}`)
    .join('\n')
  parts.push(`### Graph Overview\n${nodesOverview}\n---\n${edgesOverview}`)

  // 3. Focused node full code (main + helpers)
  const node = graph.nodes[focus]
  if (!node) throw new GraphError('Focused node not found', { focus })
  const focusMain = readFileSafe(node.main_file)
  parts.push(`### Node ${focus} - ${node.label}\n// ${node.comment ?? ''}\n\`\`\`\n${focusMain}\n\`\`\``)

  node.helper_files?.forEach(file => {
    const code = readFileSafe(file)
    parts.push(`### Helper file ${file}\n\`\`\`\n${code}\n\`\`\``)
  })

  // 4. Neighbour signatures
  neighbours(graph, focus).forEach(nId => {
    const n = graph.nodes[nId]
    if (!n) return
    const sig = signatures(readFileSafe(n.main_file))
    parts.push(`### Neighbour ${nId} (${n.label}) signatures\n\`\`\`\n${sig}\n\`\`\``)
  })

  // 5. History
  const history = loadHistory(focus)
  if (history.length) parts.push(`### Recent discussion\n${history.join('\n')}`)

  // 6. User turn
  parts.push(`User:\n${userMsg}`)

  return parts.join('\n\n')
}

//////////////////// Example call ////////////////////////////////////////////

/*
const prompt = buildPrompt({
  graph: graphDSL,
  focus: 'AuthService',
  userMsg: 'Please add rate-limit.',
  system: 'You are Blueprint AI…'
})
*/