import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@vue-flow/core'
import { executeWorkflow } from '../utils/executionEngine'
import {
  NODE_TYPES,
  createDefaultConfig,
  type ExecutionLog,
  type NodeType,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowNodeConfig,
} from '../utils/nodeTypes'
import { deserializeWorkflow, inferNextNodeNumber, serializeWorkflow } from '../utils/serializer'

export const useWorkflowStore = defineStore('workflow', () => {
  const nodes = ref<WorkflowNode[]>([])
  const edges = ref<WorkflowEdge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const logs = ref<ExecutionLog[]>([])
  const nextNodeNumber = ref(1)

  /**
   * Currently selected node object used by the config panel.
   * Returns `null` when nothing is selected.
   */
  const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) ?? null)

  /**
   * Creates a new node with a predictable id and default config,
   * then selects it so the user can configure it immediately.
   */
  function addNode(nodeType: NodeType, position: XYPosition): boolean {
    if (nodeType === NODE_TYPES.START && nodes.value.some((node) => node.type === NODE_TYPES.START)) {
      return false
    }

    if (nodeType === NODE_TYPES.END && nodes.value.some((node) => node.type === NODE_TYPES.END)) {
      return false
    }

    const id = `${nodeType}-${nextNodeNumber.value}`
    nextNodeNumber.value += 1

    nodes.value.push({
      id,
      type: nodeType,
      position,
      data: {
        config: createDefaultConfig(nodeType),
      },
    })

    selectedNodeId.value = id
    return true
  }

  /**
   * Updates selected node id (or clears it) for UI state synchronization.
   */
  function setSelectedNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  /**
   * Applies node mutations emitted by Vue Flow.
   * Handles node removal and position updates.
   */
  function onNodesChange(changes: NodeChange[]) {
    for (const change of changes) {
      if (change.type === 'remove') {
        edges.value = edges.value.filter((edge) => edge.source !== change.id && edge.target !== change.id)
        if (selectedNodeId.value === change.id) {
          selectedNodeId.value = null
        }
        nodes.value = nodes.value.filter((node) => node.id !== change.id)
        continue
      }

      if (change.type === 'position') {
        const node = nodes.value.find((item) => item.id === change.id)
        if (node && change.position) {
          node.position = change.position
        }
      }
    }
  }

  /**
   * Applies edge mutations emitted by Vue Flow.
   * Currently supports edge removal events.
   */
  function onEdgesChange(changes: EdgeChange[]) {
    for (const change of changes) {
      if (change.type === 'remove') {
        edges.value = edges.value.filter((edge) => edge.id !== change.id)
      }
    }
  }

  /**
   * Adds a new edge if source/target are valid and the exact edge
   * does not already exist.
   */
  function onConnect(connection: Connection) {
    if (!connection.source || !connection.target) return

    const sourceNode = nodes.value.find((node) => node.id === connection.source)
    if (!sourceNode) return

    const edgeId = `e-${connection.source}-${connection.target}`
    const exists = edges.value.some((edge) => edge.id === edgeId)
    if (exists) return

    const hasIncomingEdge = edges.value.some((edge) => edge.target === connection.target)
    if (hasIncomingEdge) return

    const hasOutgoingFromSource = edges.value.some((edge) => edge.source === connection.source)
    if (sourceNode.type === NODE_TYPES.TRANSFORM && hasOutgoingFromSource) return

    edges.value.push({
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      animated: true,
    })
  }

  /**
   * Patches a single field on the currently selected node config.
   * Used by the right-side node configuration panel.
   */
  function updateSelectedNodeConfig(key: string, value: unknown) {
    if (!selectedNode.value?.data) return

    selectedNode.value.data.config = {
      ...(selectedNode.value.data.config as WorkflowNodeConfig),
      [key]: value,
    }
  }

  /**
   * Executes the workflow graph and applies runtime config updates
   * (for example End node final payload) plus execution logs.
   */
  function runWorkflow() {
    const result = executeWorkflow(nodes.value, edges.value)
    for (const update of result.configUpdates) {
      const targetNode = nodes.value.find((node) => node.id === update.nodeId)
      if (!targetNode) continue

      targetNode.data.config = {
        ...targetNode.data.config,
        ...update.config,
      }
    }

    logs.value = result.logs
  }

  /**
   * Serializes current graph state for Save Workflow.
   */
  function exportWorkflow() {
    return serializeWorkflow({
      nodes: nodes.value,
      edges: edges.value,
    })
  }

  /**
   * Loads a saved workflow snapshot and resets UI execution state.
   */
  function importWorkflow(jsonText: string) {
    const snapshot = deserializeWorkflow(jsonText)

    nodes.value = snapshot.nodes
    edges.value = snapshot.edges
    selectedNodeId.value = null
    logs.value = []
    nextNodeNumber.value = inferNextNodeNumber(snapshot.nodes)
  }

  return {
    nodes,
    edges,
    selectedNode,
    selectedNodeId,
    logs,
    addNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateSelectedNodeConfig,
    runWorkflow,
    exportWorkflow,
    importWorkflow,
  }
})
