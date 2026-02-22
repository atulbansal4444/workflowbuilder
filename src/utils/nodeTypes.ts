import type { Edge, XYPosition } from '@vue-flow/core'

export const NODE_TYPES = {
  START: 'start',
  TRANSFORM: 'transform',
  END: 'end',
} as const

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES]
export type TransformOperation = 'uppercase' | 'append' | 'multiply'

/**
 * Runtime check for validating dragged/dropped node type values.
 */
export function isNodeType(value: string): value is NodeType {
  return Object.values(NODE_TYPES).includes(value as NodeType)
}

export interface StartNodeConfig {
  payload: string
}

export interface TransformNodeConfig {
  operation: TransformOperation
  field: string
  appendText: string
  multiplyBy: number
}

export interface EndNodeConfig {
  finalPayload: Record<string, unknown> | null
}

export type WorkflowNodeConfig = StartNodeConfig | TransformNodeConfig | EndNodeConfig

export interface WorkflowNode {
  id: string
  type: NodeType
  position: XYPosition
  data: {
    config: WorkflowNodeConfig
  }
}

export type WorkflowEdge = Edge

export interface ExecutionLog {
  step: number
  nodeId: string
  nodeType: NodeType
  nodeLabel: string
  payload: unknown
}

export type DropPayload = {
  nodeType: NodeType
  position: XYPosition
}

/**
 * Returns display text used in canvas/log UI for a node type.
 */
export function getNodeLabel(nodeType: NodeType): string {
  if (nodeType === NODE_TYPES.START) return 'Start Node'
  if (nodeType === NODE_TYPES.TRANSFORM) return 'Transform Node'
  return 'End Node'
}

/**
 * Provides initial config shape when a new node is created.
 */
export function createDefaultConfig(nodeType: NodeType): WorkflowNodeConfig {
  if (nodeType === NODE_TYPES.START) {
    return {
      payload: '{"message":"hello"}',
    }
  }

  if (nodeType === NODE_TYPES.TRANSFORM) {
    return {
      operation: 'uppercase',
      field: 'message',
      appendText: '',
      multiplyBy: 2,
    }
  }

  return {
    finalPayload: null,
  }
}

/**
 * Node-type guard helpers for runtime branching.
 */
export function isStartNode(node: WorkflowNode): boolean {
  return node.type === NODE_TYPES.START
}

export function isTransformNode(node: WorkflowNode): boolean {
  return node.type === NODE_TYPES.TRANSFORM
}

export function isEndNode(node: WorkflowNode): boolean {
  return node.type === NODE_TYPES.END
}

/**
 * Config-shape guard helpers for safe access in UI and execution code.
 */
export function isStartConfig(config: WorkflowNodeConfig): config is StartNodeConfig {
  return 'payload' in config
}

export function isTransformConfig(config: WorkflowNodeConfig): config is TransformNodeConfig {
  return 'operation' in config
}

export function isEndConfig(config: WorkflowNodeConfig): config is EndNodeConfig {
  return 'finalPayload' in config
}
