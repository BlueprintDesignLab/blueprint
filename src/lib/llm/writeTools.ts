export const writeProjectFile: BPTool = {
    "type": "function",
    "name": "write_project_file",
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

export const writePlanMD: BPTool = {
    "type": "function",
    "name": "write_plan_md_file",
    "description": `Create or replace a the plan.md file.`,
    "parameters": {
      "type": "object",
      "properties": {
        "content": {
          "type": "string",
          "description": "Full text content to write into the file."
        }
      },
      "required": ["content"],
      "additionalProperties": false
    },
    "strict": true
}

export const writeGraphYAMLFile: BPTool = {
    "type": "function",
    "name": "write_graph_yaml_file",
    "description": `Create or replace a the graph.yaml file.`,
    "parameters": {
      "type": "object",
      "properties": {
        "content": {
          "type": "string",
          "description": "Full text content to write into the file."
        }
      },
      "required": ["content"],
      "additionalProperties": false
    },
    "strict": true
}