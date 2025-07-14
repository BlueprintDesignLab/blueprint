import type { Tool } from "openai/resources/responses/responses.mjs";

export const readTools: Tool[] = [
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