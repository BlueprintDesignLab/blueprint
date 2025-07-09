import { type Tool } from "openai/resources/responses/responses.mjs";
import { sharedTools } from "../sharedTools";

const graphTools: Tool[] = [
  {
    "type": "function",
    "name": "propose_graph",
    "description": "Replace /blueprint/graph.yaml with the supplied complete YAML content. The IDE will preview the change for approval before writing.",
    "parameters": {
      "type": "object",
      "properties": {
        "content": {
          "type": "string",
          "description": "Entire contents of the new graph.yaml file."
        }
      },
      "required": ["content"],
      "additionalProperties": false
    },
    "strict": true
  }
]

const writeTools: Tool[] = [
  {
    "type": "function",
    "name": "write_blueprint_file",
    "description": `Create or replace a text file anywhere under /.blueprint. Automatically makes missing parent directories and rejects paths that escape the sandbox.`,
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "File path **relative to the /.blueprint directory**, e.g. \"graph.yaml\" or \"edges/audio_bus/spec.txt\"."
        },
        "content": {
          "type": "string",
          "description": "Full text content to write into the file."
        }
      },
      "required": ["path", "content"],
      "additionalProperties": false
    },
    "strict": true
  },
  {
  "type": "function",
  "name": "write_project_file",
  "description": "Create or replace a text file anywhere under /src. Automatically makes missing parent directories and rejects paths that escape the sandbox.",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "File path relative to the /src directory"
      },
      "content": {
        "type": "string",
        "description": "Full text content to write into the file."
      }
    },
    "required": ["path", "content"],
    "additionalProperties": false
  },
  "strict": true
}
]


// /**
//  * High-level cognitive tools for LLM agents.
//  * Focuses on planning, reflection, and task management.
//  */
// // Combined exports
export const architectTools: Tool[] = [
  // ...graphTools,
  ...writeTools,
  ...sharedTools,
  // ...planningTools,
  // ...knowledgeTools,
  // ...reflectionTools
];

// // // Planning and Task Management
// // export const planningTools: Tool[] = [
// //   {
// //     type: "function",
// //     name: "create_plan",
// //     description: "Break down a high-level goal into actionable subtasks.",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         goal: {
// //           type: "string",
// //           description: "The high-level goal to break down."
// //         },
// //         context: {
// //           type: "string",
// //           description: "Additional context for planning."
// //         }
// //       },
// //       required: ["goal"],
// //       additionalProperties: false
// //     },
// //     strict: true
// //   },
// //   {
// //     type: "function",
// //     name: "update_plan",
// //     description: "Update an existing plan based on new information or progress.",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         planId: { type: "string" },
// //         updates: {
// //           type: "object",
// //           properties: {
// //             status: { 
// //               type: "string", 
// //               enum: ["pending", "in_progress", "blocked", "completed"] 
// //             },
// //             notes: { type: "string" }
// //           },
// //           additionalProperties: false
// //         }
// //       },
// //       required: ["planId", "updates"],
// //       additionalProperties: false
// //     },
// //     strict: true
// //   }
// // ];

// // // Knowledge and Context Management
// // export const knowledgeTools: Tool[] = [
// //   {
// //     type: "function",
// //     name: "store_knowledge",
// //     description: "Save important information for future reference.",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         key: { type: "string" },
// //         content: { type: "string" },
// //         tags: {
// //           type: "array",
// //           items: { type: "string" }
// //         }
// //       },
// //       required: ["key", "content"],
// //       additionalProperties: false
// //     },
// //     strict: true
// //   },
// //   {
// //     type: "function",
// //     name: "recall_knowledge",
// //     description: "Retrieve stored knowledge by key or tags.",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         key: { type: "string" },
// //         tags: {
// //           type: "array",
// //           items: { type: "string" }
// //         }
// //       },
// //       additionalProperties: false
// //     },
// //     strict: true
// //   }
// // ];

// // // Reflection and Learning
// // export const reflectionTools: Tool[] = [
// //   {
// //     type: "function",
// //     name: "evaluate_outcome",
// //     description: "Evaluate the outcome of an action or task.",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         task: { type: "string" },
// //         outcome: { type: "string" },
// //         learnings: { type: "string" }
// //       },
// //       required: ["task", "outcome"],
// //       additionalProperties: false
// //     },
// //     strict: true
// //   },
// //   {
// //     type: "function",
// //     name: "suggest_improvements",
// //     description: "Suggest improvements for a completed task or process.",
// //     parameters: {
// //       type: "object",
// //       properties: {
// //         task: { type: "string" },
// //         context: { type: "string" }
// //       },
// //       required: ["task"],
// //       additionalProperties: false
// //     },
// //     strict: true
// //   }
// // ];