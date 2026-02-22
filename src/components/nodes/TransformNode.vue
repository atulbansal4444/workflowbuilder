<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data?: {
    label?: string
  }
}>()
</script>

<template>
  <Handle type="target" :position="Position.Top" />
  <div class="wf-node-content">{{ data?.label ?? 'Transform Node' }}</div>
  <Handle type="source" :position="Position.Bottom" />
</template>
