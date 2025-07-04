import { type Tool } from "openai/resources/responses/responses.mjs";

// export const architectTools: Tool[] = [{
//     "type": "function",
//     "name": "modify_graph",
//     "description": "Generate new graph_yaml and contracts_yaml string based on new architecture and needs following BlueprintLang syntax.",
//     "parameters": {
//         "type": "object",
//         "properties": {
//             "graph_yaml": {
//                 "type": "string",
//                 "description": "a yaml string of the new graph structure including all parameters of BlueprintLang"
//             },
//             "contracts_yaml": {
//                 "type": "string",
//                 "description": "a yaml string of the new edge contracts between graph nodes including all parameters of BlueprintLang"
//             }
//         },
//         "required": [
//             "graph_yaml",
//             "contracts_yaml"
//         ],
//         "additionalProperties": false
//     }
// }]


export const coderTools: Tool[] = [
  {
    "type": "function",
    "name": "write_file",
    "description": "Create or overwrite a text file inside the current project root.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "Relative path from the project root, e.g. \"src/main.rs\" or \"docs/README.md\"."
        },
        "content": {
          "type": "string",
          "description": "Full text content to write to the file."
        }
      },
      "required": ["path", "content"],
      "additionalProperties": false
    },
    "strict": true
  },
  {
    "type": "function",
    "name": "read_file",
    "description": "Read the contents of a text file inside the current project root.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "Relative path from the project root to the file."
        }
      },
      "required": ["path"],
      "additionalProperties": false
    },
    "strict": true
  },
  {
    "type": "function",
    "name": "run_command",
    "description": "Run an arbitrary system command from inside the project root and capture stdout / stderr.",
    "parameters": {
      "type": "object",
      "properties": {
        "cmd": {
          "type": "string",
          "description": "Executable or script to run, e.g. \"cargo\" or \"npm\"."
        },
        "args": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Command-line arguments in order, e.g. [\"build\", \"--release\"]."
        },
        "requires_approval": {
          "type": "boolean",
          "description": "Set to true once the human user has explicitly approved running this command."
        }
      },
      "required": ["cmd", "args", "requires_approval"],
      "additionalProperties": false
    },
    "strict": true
  },
  {
    "type": "function",
    "name": "read_project",
    "description": "Return a depth-limited directory tree of an existing project folder.",
    "parameters": {
      "type": "object",
      "properties": {
        "path": {
          "type": "string",
          "description": "Relative or absolute path of the project root to walk."
        }
      },
      "required": ["path"],
      "additionalProperties": false
    },
    "strict": true
  },
  {
    "type": "function",
    "name": "end_agentic_loop",
    "description": "Explicitly tell the IDE to terminate the current agent-execution loop. Use this when the task is complete, the AI needs human input, or an unrecoverable error occurred.",
    "parameters": {
    "type": "object",
    "properties": {
        "reason": {
            "type": "string",
            "description": "Optional short explanation shown to the user (e.g. `\"Finished all steps\"`, `\"Awaiting domain expert decision\"`)."
        }
    },
    "required": [],
    "additionalProperties": false
    },
    "strict": false
  }
]