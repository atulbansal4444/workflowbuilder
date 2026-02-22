# Flow-Based Workflow Builder

A visual workflow editor built with Vue 3 for creating, running, and saving simple node-based flows.

## Purpose

This project demonstrates a lightweight workflow-builder experience similar to tools like n8n/Node-RED, focused on:

- building flows through drag-and-drop,
- configuring node behavior from a side panel,
- simulating execution with runtime logs,
- and saving/loading workflows as JSON.

## What the App Does

- Provides a node palette with `Start`, `Transform`, and `End` nodes.
- Lets you drag nodes onto a canvas and connect them visually.
- Restricts flow shape to keep execution simple and deterministic:
	- only one `Start` node,
	- only one `End` node,
	- one incoming edge per target node,
	- one outgoing edge from a `Transform` node.
- Runs the flow from `Start` to `End` and shows execution logs.
- Supports `Save Workflow` and `Load Workflow` using JSON files.
- Includes light/dark theme toggle.

## Tech Stack

- Vue 3
- Pinia
- Vue Flow (`@vue-flow/core`)
- Vite

## Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm 9+

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open the local URL shown by Vite (typically `http://localhost:5173`).

## Available Scripts

- `npm run dev` — run local development server.
- `npm run build` — build production assets into `dist/`.
- `npm run preview` — preview the production build locally.

## How to Use

1. Drag nodes from the left palette to the canvas.
2. Connect nodes by dragging from a source handle to a target handle.
3. Select a node and edit configuration in the right panel:
	 - `Start`: JSON object payload input.
	 - `Transform`: operation (`uppercase`, `append`, `multiply`) and field settings.
	 - `End`: displays final payload after execution.
4. Click `Run Workflow` to simulate.
5. Review results in the execution log panel.
6. Use `Save Workflow` to export JSON and `Load Workflow` to import it back.

## Project Structure

```text
workflowbuilder/
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
├── vercel.json
├── public/
│   └── vite.svg
└── src/
	├── App.vue
	├── main.js
	├── style.css
	├── assets/
	│   └── vue.svg
	├── components/
	│   ├── ExecutionLogPanel.vue
	│   ├── NodeConfigPanel.vue
	│   ├── NodePalette.vue
	│   ├── WorkflowCanvas.vue
	│   └── nodes/
	│       ├── EndNode.vue
	│       ├── StartNode.vue
	│       └── TransformNode.vue
	├── store/
	│   └── workflowStore.ts
	└── utils/
		├── executionEngine.ts
		├── nodeTypes.ts
		└── serializer.ts
```

Key files:

- `src/App.vue` — overall layout, toolbar actions, and orchestration.
- `src/components/WorkflowCanvas.vue` — canvas rendering and graph interactions.
- `src/store/workflowStore.ts` — central workflow state and actions.
- `src/utils/executionEngine.ts` — workflow simulation logic.

## Deployment Notes

The repository includes deployment config for:

- Vercel (`vercel.json`)

For static hosting on any provider, run `npm run build` and deploy the `dist/` directory.
