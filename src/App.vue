<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NodePalette from './components/NodePalette.vue'
import WorkflowCanvas from './components/WorkflowCanvas.vue'
import NodeConfigPanel from './components/NodeConfigPanel.vue'
import ExecutionLogPanel from './components/ExecutionLogPanel.vue'
import { useWorkflowStore } from './store/workflowStore'
import { NODE_TYPES, type DropPayload } from './utils/nodeTypes'

const workflow = useWorkflowStore()
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref('')
const isDarkMode = ref(false)
const themeStorageKey = 'workflowbuilder-theme'

const selectedNode = computed(() => workflow.selectedNode)
const hasStartNode = computed(() => workflow.nodes.some((node) => node.type === NODE_TYPES.START))
const hasEndNode = computed(() => workflow.nodes.some((node) => node.type === NODE_TYPES.END))

function onNodeDropped(payload: DropPayload) {
  const added = workflow.addNode(payload.nodeType, payload.position)
  if (!added) {
    importError.value = payload.nodeType === NODE_TYPES.START
      ? 'Only one Start Node is allowed.'
      : 'Only one End Node is allowed.'
    return
  }

  importError.value = ''
}

function runWorkflow() {
  workflow.runWorkflow()
}

function updateSelectedConfig(key: string, value: unknown) {
  workflow.updateSelectedNodeConfig(key, value)
}

function saveWorkflowJson() {
  const content = workflow.exportWorkflow()
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'workflow.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function openImportPicker() {
  fileInput.value?.click()
}

function loadWorkflowJsonFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      workflow.importWorkflow(String(reader.result ?? ''))
      importError.value = ''
    } catch (error) {
      importError.value = error instanceof Error ? error.message : 'Failed to load workflow JSON'
    }
  }
  reader.readAsText(file)
  target.value = ''
}

function applyTheme(darkMode: boolean) {
  isDarkMode.value = darkMode
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  localStorage.setItem(themeStorageKey, darkMode ? 'dark' : 'light')
}

function toggleTheme() {
  applyTheme(!isDarkMode.value)
}

onMounted(() => {
  const storedTheme = localStorage.getItem(themeStorageKey)
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(storedTheme ? storedTheme === 'dark' : prefersDarkMode)
})
</script>

<template>
  <div class="builder-layout">
    <NodePalette :has-start-node="hasStartNode" :has-end-node="hasEndNode" />

    <main class="canvas-section">
      <header class="toolbar">
        <h1>Flow-Based Workflow Builder</h1>
        <div class="toolbar-actions">
          <button @click="toggleTheme">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</button>
          <button @click="runWorkflow">Run Workflow</button>
          <button @click="saveWorkflowJson">Save Workflow</button>
          <button @click="openImportPicker">Load Workflow</button>
          <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="loadWorkflowJsonFile" />
        </div>
      </header>

      <WorkflowCanvas
        :nodes="workflow.nodes"
        :edges="workflow.edges"
        :selected-node-id="workflow.selectedNodeId"
        @nodes-change="workflow.onNodesChange"
        @edges-change="workflow.onEdgesChange"
        @connect="workflow.onConnect"
        @node-selected="workflow.setSelectedNode"
        @pane-clicked="workflow.setSelectedNode(null)"
        @node-dropped="onNodeDropped"
      />

      <ExecutionLogPanel :logs="workflow.logs" />
    </main>

    <NodeConfigPanel :selected-node="selectedNode" @update-config="updateSelectedConfig" />
    <p v-if="importError" class="error global-error">{{ importError }}</p>
  </div>
</template>
