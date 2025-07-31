### Interface/Contract DD Project Layout

```
/.blueprint/
   graph.yaml          # one file, whole repo
   nodes/<id>/         # history, metrics … (dynamic)
   edges/<id>/         # history, test results …
	   <id>.schema.json # a json schema if applicable
/src/                  # normal source code (TS, Rust, C++…)
   edges/
      autogen/         # generated data contract stubs (from schema)
      interfaces/      # handwritten or AI-authored interface/trait files
```

Nodes = self-contained components (one language each).
Edges = contracts linking two nodes.
Static facts (paths, comments, contracts) live only in graph.yaml.
Runtime context (chat, logs) stays inside the per-node / per-edge folders.

### Import / build rules

Node code may import
- its own source, **plus**
- the stub file(s) listed for it in each connected edge (see below).

Edges come in two channels:
- Data (cross-language/inter-process):
- Edge declares a schema file (e.g. JSON Schema, Protobuf, OpenAPI).
- A static code generator creates one stub per node in /src/edges/autogen/.
- Each node imports only its own generated stub.
    
- Interface (same-language/intra-process):
- Edge declares a canonical handwritten interface or trait file in /src/edges/interfaces/.
- Both nodes import only the edge’s interface, never from each other.
- The edge file may contain function signatures, classes, or a mediator/bus.

```
# blueprint/graph.yaml
nodes:
  <NodeID>:                 # e.g. NodeA, NodeB
    label: "<Human Label>"  # e.g. "Primary Worker"
    main_file: "<path>"     # required: path to the node’s primary source file, this is the only file allowed to interact with neighbouring edges
    helper_files:           # optional: supporting files
      - "<path/to/helper1>"
      - "<path/to/helper2>"
    comment: |              # required: free-form description
      This is a multi-line
      explanation of what
      this node does.

edges:
  <EdgeID>:                 # e.g. data_flow, control_channel
    label: "<Human Label>"  # e.g. "Data Flow"
    # For data edges (cross-language):
    schema_file: .blueprint/edges/data_flow.schema.json
    stub_files:
      <NodeID1>: src/edges/autogen/data_flow.NodeA.ts
      <NodeID2>: src/edges/autogen/data_flow.NodeB.cpp
    # For interface edges (same-language/intra-process):
    interface_file: src/edges/interfaces/DataBus.ts
    source: "<NodeID>"      # required: producer node ID
    target: "<NodeID>"      # required: consumer node ID
    comment: |              # required: free-form description
      Describe the API or
      data flow here.
```

For cross-language scenarios
- The edge lists a schema file plus a stub file for each connected node specifying the correct language/format for each.
- For intra-process/same-language, the edge lists only a single interfaceFile.