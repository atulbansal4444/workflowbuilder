import {
  getNodeLabel,
  isEndConfig,
  isEndNode,
  isStartConfig,
  isStartNode,
  isTransformConfig,
  isTransformNode,
  NODE_TYPES,
  type ExecutionLog,
  type WorkflowEdge,
  type WorkflowNode,
} from './nodeTypes'

export interface ExecutionResult {
  logs: ExecutionLog[]
  configUpdates: Array<{
    nodeId: string
    config: WorkflowNode['data']['config']
  }>
}

/**
 * Deep-clones JSON-safe values to prevent accidental shared references
 * between runtime payload and persisted node config.
 */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

/**
 * Applies a single Transform node operation to the current payload.
 */
function applyTransform(payload: Record<string, unknown>, config: { operation: string; field: string; appendText: string; multiplyBy: number }): Record<string, unknown> {
  const nextPayload = deepClone(payload)
  const field = config.field?.trim() || 'message'

  if (config.operation === 'uppercase') {
    if (typeof nextPayload[field] === 'string') {
      nextPayload[field] = nextPayload[field].toUpperCase()
    }
    return nextPayload
  }

  if (config.operation === 'append') {
    const current = nextPayload[field]
    nextPayload[field] = `${typeof current === 'undefined' ? '' : String(current)}${config.appendText ?? ''}`
    return nextPayload
  }

  const current = nextPayload[field]
  if (typeof current === 'number') {
    const factor = Number(config.multiplyBy)
    if (!Number.isNaN(factor)) {
      nextPayload[field] = current * factor
    }
  }

  return nextPayload
}

/**
 * Parses and validates the Start node payload as a JSON object.
 */
function resolveStartPayload(startNode: WorkflowNode): Record<string, unknown> {
  const config = startNode.data.config
  if (!isStartConfig(config)) {
    throw new Error('Start Node payload is missing.')
  }

  const parsed = JSON.parse(config.payload || '{}')
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Start Node payload must be a JSON object.')
  }

  return parsed as Record<string, unknown>
}

/**
 * Executes workflow from Start node following outgoing edges until End,
 * collecting execution logs and config updates for nodes that display output.
 */
export function executeWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ExecutionResult {
  const logs: ExecutionLog[] = []
  const configUpdates: ExecutionResult['configUpdates'] = []
  const startNode = nodes.find((node) => isStartNode(node))
  const endNode = nodes.find((node) => isEndNode(node))

  if (!startNode || !endNode) {
    const reason = !startNode && !endNode
      ? 'Start Node and End Node are required.'
      : !startNode
        ? 'Start Node is required.'
        : 'End Node is required.'

    return {
      logs: [
        {
          step: 1,
          nodeId: 'system',
          nodeType: NODE_TYPES.START,
          nodeLabel: 'System',
          payload: `Workflow is incomplete. ${reason}`,
        },
      ],
      configUpdates,
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = resolveStartPayload(startNode)
  } catch (error) {
    return {
      logs: [
        {
          step: 1,
          nodeId: startNode.id,
          nodeType: startNode.type,
          nodeLabel: getNodeLabel(startNode.type),
          payload: error instanceof Error ? error.message : 'Invalid start payload.',
        },
      ],
      configUpdates,
    }
  }

  logs.push({
    step: logs.length + 1,
    nodeId: startNode.id,
    nodeType: startNode.type,
    nodeLabel: getNodeLabel(startNode.type),
    payload: deepClone(payload),
  })

  const visited = new Set([startNode.id])
  let currentNode = startNode

  while (currentNode) {
    const nextEdge = edges.find((edge) => edge.source === currentNode.id)
    if (!nextEdge) break

    const nextNode = nodes.find((node) => node.id === nextEdge.target)
    if (!nextNode) break

    if (visited.has(nextNode.id)) {
      logs.push({
        step: logs.length + 1,
        nodeId: nextNode.id,
        nodeType: nextNode.type,
        nodeLabel: getNodeLabel(nextNode.type),
        payload: `Cycle detected at ${getNodeLabel(nextNode.type)}. Stopping execution.`,
      })
      break
    }

    visited.add(nextNode.id)

    if (isTransformNode(nextNode)) {
      const config = nextNode.data.config
      if (isTransformConfig(config)) {
        payload = applyTransform(payload, config)
      }

      logs.push({
        step: logs.length + 1,
        nodeId: nextNode.id,
        nodeType: nextNode.type,
        nodeLabel: getNodeLabel(nextNode.type),
        payload: deepClone(payload),
      })
    }

    if (isEndNode(nextNode)) {
      const config = nextNode.data.config
      const finalPayloadConfig = {
        finalPayload: deepClone(payload),
      }

      if (isEndConfig(config)) {
        configUpdates.push({
          nodeId: nextNode.id,
          config: {
            ...config,
            finalPayload: finalPayloadConfig.finalPayload,
          },
        })
      } else {
        configUpdates.push({
          nodeId: nextNode.id,
          config: finalPayloadConfig,
        })
      }

      logs.push({
        step: logs.length + 1,
        nodeId: nextNode.id,
        nodeType: nextNode.type,
        nodeLabel: getNodeLabel(nextNode.type),
        payload: deepClone(payload),
      })
    }

    if (nextNode.type === NODE_TYPES.END) {
      break
    }

    currentNode = nextNode
  }

  return {
    logs,
    configUpdates,
  }
}
