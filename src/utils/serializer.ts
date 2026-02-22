import type { WorkflowEdge, WorkflowNode } from './nodeTypes'

export interface WorkflowSnapshot {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

/**
 * Converts a workflow snapshot into formatted JSON for download/storage.
 */
export function serializeWorkflow(snapshot: WorkflowSnapshot): string {
  return JSON.stringify(snapshot, null, 2)
}

/**
 * Narrowing helper for object-like JSON values.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Runtime guard for the minimal snapshot contract used by this app.
 */
function isWorkflowSnapshot(value: unknown): value is WorkflowSnapshot {
  if (!isObject(value)) return false

  const nodes = value['nodes']
  const edges = value['edges']

  return Array.isArray(nodes) && Array.isArray(edges)
}

/**
 * Parses saved JSON and validates required top-level fields.
 * Throws when payload is not a workflow snapshot.
 */
export function deserializeWorkflow(jsonText: string): WorkflowSnapshot {
  const parsed: unknown = JSON.parse(jsonText)

  if (!isWorkflowSnapshot(parsed)) {
    throw new Error('Invalid workflow JSON format. Expected { nodes: [], edges: [] }.')
  }

  return {
    nodes: parsed.nodes,
    edges: parsed.edges,
  }
}

/**
 * Finds the highest numeric suffix in node ids and returns the next value,
 * so newly created node ids remain unique after loading a workflow.
 */
export function inferNextNodeNumber(nodes: WorkflowNode[]): number {
  const maxCounter = nodes.reduce((maxValue, node) => {
    const match = node.id.match(/-(\d+)$/)
    if (!match) return maxValue
    return Math.max(maxValue, Number(match[1]))
  }, 0)

  return maxCounter + 1
}
