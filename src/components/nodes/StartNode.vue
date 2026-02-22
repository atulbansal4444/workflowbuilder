<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data?: {
    label?: string
  }
}>()
</script>

<template>
  <div class="wf-node-content">{{ data?.label ?? 'Start Node' }}</div>
  <Handle type="source" :position="Position.Bottom" />
</template>
