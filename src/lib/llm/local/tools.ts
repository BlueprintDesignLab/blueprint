import { type Tool } from "openai/resources/responses/responses.mjs";
import { sharedTools } from "../sharedTools";

const writeTools: Tool[] = [
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
  }
]

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
export const localTools: Tool[] = [
  ...sharedTools,
  ...writeTools,
  ...systemTools,
  ...graphQueryTools,
];

export default minimalTools;
