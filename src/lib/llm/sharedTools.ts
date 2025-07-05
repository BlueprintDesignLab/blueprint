// src/lib/llm/shared_tools.ts
import { type Tool } from "openai/resources/responses/responses.mjs";

export const endAgenticLoopTool: Tool = {
  type: "function",
  name: "end_agentic_loop",
  description: "Signal that the agentic loop should end. Use this when you have completed your task, or cannot proceed further. Always provide a reason.",
  parameters: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "A clear, human-readable reason for ending the loop (e.g., 'Task complete', 'Blocked by missing dependency', 'Awaiting human approval')."
      }
    },
    required: ["reason"],
    additionalProperties: false
  },
  strict: true
};

export const sharedTools = [
    endAgenticLoopTool
]