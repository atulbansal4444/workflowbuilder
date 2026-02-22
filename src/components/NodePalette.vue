<script setup lang="ts">
import { NODE_TYPES } from '../utils/nodeTypes'

const props = defineProps<{
  hasStartNode: boolean
  hasEndNode: boolean
}>()

function onDragStart(event: DragEvent, nodeType: string) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('application/vueflow', nodeType)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="palette-panel">
    <h2>Node Palette</h2>
    <p>Drag nodes to canvas</p>

    <div class="node-inline-row">
      <button
        class="node-item node-item--start"
        :draggable="!props.hasStartNode"
        :disabled="props.hasStartNode"
        @dragstart="onDragStart($event, NODE_TYPES.START)"
      >
        Start Node
      </button>
      <button
        class="node-item node-item--end"
        :draggable="!props.hasEndNode"
        :disabled="props.hasEndNode"
        @dragstart="onDragStart($event, NODE_TYPES.END)"
      >
        End Node
      </button>
    </div>

    <button class="node-item node-item--transform" draggable="true" @dragstart="onDragStart($event, NODE_TYPES.TRANSFORM)">
      Transform Node
    </button>
  </aside>
</template>
