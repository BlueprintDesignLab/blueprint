// src/lib/llm/shared_tools.ts
import { type Tool } from "openai/resources/responses/responses.mjs";

export const endAgenticLoopTools: Tool[] = [
  {
    type: "function",
    name: "end_agentic_loop_success",
    description:
      "Signal that the agentic loop has completed successfully. ",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description:
            "A clear, human-readable reason for ending the loop."
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
    description: "Signal that the agentic loop should end an error occurred or the same tools have been called 5 times with no progress.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description:
            "A clear, human-readable reason for ending the loop."
        }
      },
      required: ["reason"],
      additionalProperties: false
    },
    strict: true
  },
  {
    type: "function",
    name: "refer",
    description: "Refer the user to another agent which is responsible for the task they need achieved as of the latest progress.",
    parameters: {
      type: "object",
      properties: {
        role: {
          type: "string",
          description:
            "The agent to refer too. 'plan' | 'architect' | 'code'."
        }
      },
      required: ["role"],
      additionalProperties: false
    },
    strict: true
  }
];

const searchTool: Tool = { type: "web_search_preview" }

export const sharedTools: Tool[] = [
  ...endAgenticLoopTools,
  searchTool,
]