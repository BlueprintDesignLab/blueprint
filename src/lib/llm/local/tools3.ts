import { type Tool } from "openai/resources/responses/responses.mjs";

// Tier 1: Basic File Operations
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
        path: {
          type: "string",
          description: "Relative path from the project root."
        },
        content: {
          type: "string",
          description: "Content to write to the file."
        }
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
        path: {
          type: "string",
          description: "Path to list, relative to project root."
        },
        recursive: {
          type: "boolean",
          description: "Whether to list recursively.",
          default: false
        }
      },
      required: ["path", "recursive"],
      additionalProperties: false
    },
    strict: true
  }
];

// Tier 2: System Operations
export const systemTools: Tool[] = [
  {
    type: "function",
    name: "run_command",
    description: "Execute a shell command.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The command to execute."
        },
        args: {
          type: "array",
          items: { type: "string" },
          description: "Command arguments."
        },
        requiresApproval: {
          type: "boolean",
          description: "Whether human approval is needed.",
          default: true
        }
      },
      required: ["command", "args", "requiresApproval"],
      additionalProperties: false
    },
    strict: true
  }
];

// Tier 3: Graph Query Operations
export const graphQueryTools: Tool[] = [
  {
    type: "function",
    name: "get_graph",
    description: "Get the current graph structure.",
    parameters: {
      type: "object",
      properties: {
        includeDetails: {
          type: "boolean",
          description: "Include detailed node/edge info.",
          default: false
        }
      },
      required: [],
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
        nodeId: {
          type: "string",
          description: "ID of the node to retrieve."
        }
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
        edgeId: {
          type: "string",
          description: "ID of the edge to retrieve."
        }
      },
      required: ["edgeId"],
      additionalProperties: false
    },
    strict: true
  }
];

// Tier 4: Graph Modification Operations
export const graphModificationTools: Tool[] = [
  // Node Operations
  {
    type: "function",
    name: "add_node",
    description: "Add a new node to the graph.",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        label: { type: "string" },
        mainFile: { type: "string" },
        comment: { type: "string" }
      },
      required: ["nodeId", "label", "mainFile"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "update_node",
    description: "Update an existing node.",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        updates: {
          type: "object",
          properties: {
            label: { type: "string" },
            mainFile: { type: "string" },
            comment: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["nodeId", "updates"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "remove_node",
    description: "Remove a node from the graph.",
    parameters: {
      type: "object",
      properties: {
        nodeId: { type: "string" },
        force: {
          type: "boolean",
          default: false,
          description: "Force removal even if connected edges exist."
        }
      },
      required: ["nodeId"],
      additionalProperties: false
    },
    strict: true
  },
  // Edge Operations
  {
    type: "function",
    name: "add_edge",
    description: "Add a new edge between nodes.",
    parameters: {
      type: "object",
      properties: {
        edgeId: { type: "string" },
        source: { type: "string" },
        target: { type: "string" },
        interfaceFile: { type: "string" },
        label: { type: "string" }
      },
      required: ["edgeId", "source", "target", "interfaceFile"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "update_edge",
    description: "Update an existing edge.",
    parameters: {
      type: "object",
      properties: {
        edgeId: { type: "string" },
        updates: {
          type: "object",
          properties: {
            label: { type: "string" },
            interfaceFile: { type: "string" }
          },
          additionalProperties: false
        }
      },
      required: ["edgeId", "updates"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "remove_edge",
    description: "Remove an edge from the graph.",
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

// Control Tools
export const controlTools: Tool[] = [
  {
    type: "function",
    name: "end_agentic_loop",
    description: "Terminate the current execution loop.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for termination."
        }
      },
      required: [],
      additionalProperties: false
    },
    strict: false
  }
];

// Combined exports for backward compatibility
export const coderTools = [...fileTools, ...systemTools];
export const allTools = [
  ...fileTools,
  ...systemTools,
  ...graphQueryTools,
  ...graphModificationTools,
  ...controlTools
];