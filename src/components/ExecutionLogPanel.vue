<script setup lang="ts">
import type { ExecutionLog } from '../utils/nodeTypes'

defineProps<{
  logs: ExecutionLog[]
}>()
</script>

<template>
  <section class="logs-panel">
    <h2>Execution Logs</h2>
    <p v-if="logs.length === 0">Run the workflow to see logs.</p>
    <ul v-else>
      <li v-for="log in logs" :key="`${log.step}-${log.nodeId}`">
        {{ log.nodeLabel }} -> {{ JSON.stringify(log.payload) }}
      </li>
    </ul>
  </section>
</template>
