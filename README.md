### **1 · Graph-centric project layout**

```
/.blueprint/
   graph.yaml          # one file, whole repo
   nodes/<id>/         # history, metrics … (dynamic)
   edges/<id>/         # history, test results …
/src/                  # normal source code (TS, Rust, C++…)
```

- **Nodes** = self-contained components (one language each).
- **Edges** = contracts linking two nodes.
- **Static facts** (paths, comments, contracts) live **only** in graph.yaml.
- **Runtime context** (chat, logs) stays inside the per-node / per-edge folders.

### **2 · Import / build rules**

1. Node code may import
    - its own source, **plus**
    - the stub file(s) listed for it in each connected edge.
    
2. A stub is generated from the edge’s **single canonical contract**.
### **3 · Prompt builder**

Given a focus node or edge, it loads:
- the entity's full main file;
- sliding window of last N history for the focus;
- main files of immediate neighbours;
- full graph overview;

```
# blueprint/graph.yaml
nodes:
  <NodeID>:                 # e.g. AudioEngine, PluginHost
    label: "<Human Label>"  # e.g. "Realtime Audio Engine"
    main_file: "<path>"     # required: path to the node’s primary source file, this is the only file allowed to interact with neighbouring edges
    helper_files:           # optional: supporting files
      - "<path/to/helper1>"
      - "<path/to/helper2>"
    comment: |              # required: free-form description
      This is a multi-line
      explanation of what
      this node does.

edges:
  <EdgeID>:                 # e.g. audio_stream, plugin_control
    label: "<Human Label>"  # e.g. "Audio Buffer Flow"
    interfaceFile: "<path>" # required: single shared stub/interface file
    source: "<NodeID>"      # required: producer node ID
    target: "<NodeID>"      # required: consumer node ID
    comment: |              # required: free-form description
      Describe the API or
      data flow here.
```

For cross-language scenarios, we need a way to have a *out* file in one lang and *in* file in another languages. (Improve in V2).

| **Tier**                       | **Command**     | **Purpose**                            | **Parameters → returns**                                  |
| ------------------------------ | --------------- | -------------------------------------- | --------------------------------------------------------- |
| **Filesystem (generic)**       |                 |                                        |                                                           |
| 1                              | write_file      | Create/overwrite a file                | { path, content, requires_approval } → {} or error        |
| 2                              | read_file       | Read a file’s text                     | { path } → { content }                                    |
| 3                              | list_directory  | List files/dirs recursively (depth 2?) | { path } → { entries: [..] }                              |
| 4                              | run_command     | Shell exec inside project root         | { cmd, args, requires_approval } → { stdout, stderr }     |
| **Blueprint-aware (semantic)** |                 |                                        |                                                           |
| 5                              | get_graph       | Return in-memory JSON of graph.yaml    | {} → { graph }                                            |
| 6                              | get_node_prompt | Build focused prompt for node ID       | { node_id } → { prompt }                                  |
| 7                              | get_edge_prompt | Build focused prompt for edge ID       | { edge_id } → { prompt }                                  |
| 8                              | generate_stubs  | Run code-gen for a specific edge       | { edge_id, requires_approval } → { files_written: [...] } |


Enforceable shema:
```
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Blueprint Graph",
  "type": "object",
  "additionalProperties": false,
  "required": ["nodes", "edges"],
  "properties": {
    "nodes": {
      "type": "object",
      "description": "Mapping of node IDs to node definitions",
      "minProperties": 1,
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": ["label", "main_file", "comment"],
        "properties": {
          "label": {
            "type": "string",
            "description": "Human-friendly name of the component."
          },
          "main_file": {
            "type": "string",
            "description": "Path to the node’s primary source file."
          },
          "helper_files": {
            "type": "array",
            "description": "Optional list of additional source files.",
            "items": { "type": "string" }
          },
          "test_files": {
            "type": "array",
            "description": "Optional list of test file paths.",
            "items": { "type": "string" }
          },
          "comment": {
            "type": "string",
            "description": "Free-form description of the node’s responsibility."
          }
        }
      }
    },
    "edges": {
      "type": "object",
      "description": "Mapping of edge IDs to edge definitions",
      "minProperties": 1,
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": ["label", "interfaceFile", "source", "target", "comment"],
        "properties": {
          "label": {
            "type": "string",
            "description": "Human-friendly name of the contract/protocol."
          },
          "contract": {
            "type": "string",
            "description": "(Optional) Path to the raw contract/spec file."
          },
          "interfaceFile": {
            "type": "string",
            "description": "Path to the shared stub/interface file."
          },
          "source": {
            "type": "string",
            "description": "Node ID of the producer/provider side."
          },
          "target": {
            "type": "string",
            "description": "Node ID of the consumer/client side."
          },
          "comment": {
            "type": "string",
            "description": "Free-form description of the data flow or API."
          }
        }
      }
    }
  }
}
```

