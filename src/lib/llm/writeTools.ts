import type { Tool } from "openai/resources/responses/responses.mjs";

export const writeFile: Tool = {
    "type": "function",
    "name": "write_file",
    "description": "Create or replace a file anywhere under project root. Automatically makes missing parent directories and rejects paths that escape the sandbox.",
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

export const writeGraph: Tool = {
    "type": "function",
    "name": "write_graph",
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
}