// System command execution
export const systemTools: BPTool[] = [
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