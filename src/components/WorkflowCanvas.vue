<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { VueFlow, useVueFlow, type Connection, type EdgeChange, type NodeChange, type NodeTypesObject } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { getNodeLabel, isNodeType, type DropPayload, type WorkflowEdge, type WorkflowNode } from '../utils/nodeTypes'
import StartNode from './nodes/StartNode.vue'
import EndNode from './nodes/EndNode.vue'
import TransformNode from './nodes/TransformNode.vue'

const props = defineProps<{
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null
}>()

const emit = defineEmits<{
  (event: 'nodes-change', changes: NodeChange[]): void
  (event: 'edges-change', changes: EdgeChange[]): void
  (event: 'connect', connection: Connection): void
  (event: 'node-selected', nodeId: string | null): void
  (event: 'pane-clicked'): void
  (event: 'node-dropped', payload: DropPayload): void
}>()

const { screenToFlowCoordinate } = useVueFlow()

const nodeTypes = {
  start: markRaw(StartNode),
  transform: markRaw(TransformNode),
  end: markRaw(EndNode),
} as unknown as NodeTypesObject

const flowNodes = computed(() =>
  props.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    selected: node.id === props.selectedNodeId,
    class: [
      'wf-node',
      node.type === 'start' ? 'wf-node--start' : '',
      node.type === 'end' ? 'wf-node--end' : '',
      node.type === 'transform' ? 'wf-node--transform' : '',
    ].filter(Boolean),
    data: {
      label: getNodeLabel(node.type),
    },
  })),
)

function onDrop(event: DragEvent) {
  const nodeType = event.dataTransfer?.getData('application/vueflow')
  if (!nodeType || !isNodeType(nodeType)) return

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })

  emit('node-dropped', {
    nodeType,
    position,
  })
}
</script>

<template>
  <div class="canvas-wrapper" @dragover.prevent @drop.prevent="onDrop">
    <VueFlow
      :nodes="flowNodes"
      :edges="edges"
      :node-types="nodeTypes"
      delete-key-code="Delete"
      fit-view-on-init
      @nodes-change="emit('nodes-change', $event)"
      @edges-change="emit('edges-change', $event)"
      @connect="emit('connect', $event)"
      @node-click="emit('node-selected', $event?.node?.id ?? null)"
      @pane-click="emit('pane-clicked')"
    />
  </div>
</template>
