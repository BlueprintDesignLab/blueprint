// src/lib/llm/shared_tools.ts
import { type Tool } from "openai/resources/responses/responses.mjs";

// Core file operations
export const readProjectTools: Tool[] = [
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
    name: "list_directory_tree",
    description: "List full contents of a directory tree.",
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
      required: ["command", "args"],
      additionalProperties: false
    },
    strict: true
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Tool: successful completion
// ─────────────────────────────────────────────────────────────────────────────
export const endAgenticLoopTools: Tool[] = [
  {
    type: "function",
    name: "end_agentic_loop_success",
    description:
      "Signal that the agentic loop has completed successfully. " +
      "Use this when the task is finished and no further steps are needed. " +
      "Always provide a brief human-readable reason (e.g., 'Task complete').",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description:
            "A clear, human-readable reason for ending the loop (e.g., 'Task complete')."
        }
      },
      required: ["reason"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "end_agentic_loop_failure",
    description:
      "Signal that the agentic loop should end because something went wrong, " +
      "an unexpected result occurred, or the agent cannot proceed further. " +
      "Always provide a human-readable reason (e.g., 'Missing dependency', " +
      "'Blocked by API rate limit', 'Awaiting human approval').",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description:
            "A clear, human-readable reason for ending the loop (e.g., " +
            "'Blocked by missing dependency', 'Unexpected null response')."
        }
      },
      required: ["reason"],
      additionalProperties: false
    },
    strict: true
  }
];


const searchTool: Tool = { type: "web_search_preview" }

export const sharedTools: Tool[] = [
  ...readProjectTools,
  ...systemTools,
  ...endAgenticLoopTools,
  searchTool,
]