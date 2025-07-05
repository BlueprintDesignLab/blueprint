import { type Tool } from "openai/resources/responses/responses.mjs";
import { sharedTools } from "../sharedTools";

// Core file operations
export const fileTools: Tool[] = [
  {
    type: "function",
    name: "read_file",
    description: "Read the contents of a text file.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path from the project root."
        }
      },
      required: ["path"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "write_file",
    description: "Create or overwrite a text file.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" }
      },
      required: ["path", "content"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "list_directory",
    description: "List contents of a directory.",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"],
      additionalProperties: false
    },
    strict: true
  }
];

// System command execution
export const systemTools: Tool[] = [
  {
    type: "function",
    name: "run_command",
    description: "Execute a shell command.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string" },
        args: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["command"],
      additionalProperties: false
    },
    strict: true
  }
];

// Read-only graph operations
export const graphQueryTools: Tool[] = [
  {
    type: "function",
    name: "get_graph",
    description: "Get the current graph structure.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "get_node",
    description: "Get details about a specific node.",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" }
      },
      required: ["nodeId"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "get_edge",
    description: "Get details about a specific edge.",
    parameters: {
      type: "object",
      properties: {
        edgeId: { type: "string" }
      },
      required: ["edgeId"],
      additionalProperties: false
    },
    strict: true
  }
];

// Combined exports
export const minimalTools: Tool[] = [
  ...sharedTools,
  ...fileTools,
  ...systemTools,
  ...graphQueryTools,
];

export default minimalTools;
