import { type Tool } from "openai/resources/responses/responses.mjs";
import { sharedTools } from "../sharedTools";

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
export const workerTools: Tool[] = [
  // ...graphTools,
  ...writeTools,
  ...sharedTools,
  // ...planningTools,
  // ...knowledgeTools,
  // ...reflectionTools
];
