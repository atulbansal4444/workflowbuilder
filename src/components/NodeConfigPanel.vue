<script setup lang="ts">
import { getNodeLabel, isEndConfig, isStartConfig, isTransformConfig, type WorkflowNode } from '../utils/nodeTypes'

defineProps<{
  selectedNode: WorkflowNode | null
}>()

const emit = defineEmits<{
  (event: 'update-config', key: string, value: unknown): void
}>()
</script>

<template>
  <aside class="config-panel">
    <h2>Node Configuration</h2>
    <p v-if="!selectedNode">Select a node on canvas to configure it.</p>

    <div v-else-if="selectedNode.data" class="config-form">
      <h3>{{ getNodeLabel(selectedNode.type) }}</h3>

      <template v-if="selectedNode.type === 'start' && isStartConfig(selectedNode.data.config)">
        <label>Input Payload (JSON)</label>
        <textarea
          :value="selectedNode.data.config.payload"
          rows="8"
          @input="emit('update-config', 'payload', ($event.target as HTMLTextAreaElement).value)"
        />
      </template>

      <template v-else-if="selectedNode.type === 'transform' && isTransformConfig(selectedNode.data.config)">
        <label>Operation</label>
        <select
          :value="selectedNode.data.config.operation"
          @change="emit('update-config', 'operation', ($event.target as HTMLSelectElement).value)"
        >
          <option value="uppercase">Uppercase</option>
          <option value="append">Append Text</option>
          <option value="multiply">Multiply Number</option>
        </select>

        <label>Target Field</label>
        <input
          type="text"
          :value="selectedNode.data.config.field"
          @input="emit('update-config', 'field', ($event.target as HTMLInputElement).value)"
        />

        <template v-if="selectedNode.data.config.operation === 'append'">
          <label>Text to Append</label>
          <input
            type="text"
            :value="selectedNode.data.config.appendText"
            @input="emit('update-config', 'appendText', ($event.target as HTMLInputElement).value)"
          />
        </template>

        <template v-if="selectedNode.data.config.operation === 'multiply'">
          <label>Multiply By</label>
          <input
            type="number"
            :value="selectedNode.data.config.multiplyBy"
            @input="emit('update-config', 'multiplyBy', Number(($event.target as HTMLInputElement).value))"
          />
        </template>
      </template>

      <template v-else-if="selectedNode.type === 'end' && isEndConfig(selectedNode.data.config)">
        <label>Final Received Payload</label>
        <pre>{{ JSON.stringify(selectedNode.data.config.finalPayload, null, 2) }}</pre>
      </template>
    </div>

    <p v-else>Selected node has no data to configure.</p>
  </aside>
</template>
