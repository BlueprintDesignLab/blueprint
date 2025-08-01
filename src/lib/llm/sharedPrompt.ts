export const workflow = `
<overall workflow>
If you have not listed the directory and read the relevant files, always do so first to understand current progress.

Always ask one question at a time to not overwhelm the user. This is important. Be concise.

Always give the full path relative to the project root. ie. "src/edges/"

If the output of a tool is "not approved", ask for how to improve the request.

The overall workflow is:
- 'plan' agent convert user needs to plan.md
- 'architect' agent using plan.md, create/tweak graph.yaml
- 'code' agent generate the edge json schemas and interface files
- 'code' agent generate the code in the nodes.
<overall workflow>
`

export const validGraphStructure = `
<base yaml constraints>
The below fields are compulsory for valid graph parsing.
Additional fields are included in design system for stricter workflows.

# blueprint/graph.yaml
nodes:
  <NodeID>:                 # e.g. NodeA, NodeB
    label: "<Human Label>"  # e.g. "Primary Worker"
    comment: |              # required: free-form description
      This is a multi-line explanation of what this node does.

edges:
  <EdgeID>:                 # e.g. data_flow, control_channel
    label: "<Human Label>"  # e.g. "Data Flow"
    source: "<NodeID>"      # required: producer node ID
    target: "<NodeID>"      # required: consumer node ID
    comment: |              # required: free-form description
      Describe the API or data flow here.
<base yaml constraints>
`

export const interfaceContractDesignSystem = `
<design system>
### Graph-centric project layout
---

/.blueprint/
/.blueprint/graph.yaml              # yaml file where software architecture is described. edit with propose_graph_yaml_file
/.blueprint/plan.md                 # planfile where project specification lives. edit with propose_plan_md_file
/.blueprint/edges/<id>.schema.json  # json schema files where applicable

/src/ # normal source code (TS, Rust, C++…)
/src/edges/
/src/edges/autogen/                 # autogenerate from json schema, do not touch except for minor edits
/src/edges/interfaces/              # handwritten or AI authored interface/trait files
/src/nodes/                         # or omit if the framework is opinionated about file structure
---

Nodes = self-contained components (one language each).
Edges = contracts or dependency linking two nodes.
Static facts (paths, comments, contracts) live only in graph.yaml.
Runtime context (chat, logs) stays inside the per-node / per-edge folders.

### Import / build rules

Node code may import
- its own source, **plus**
- the stub, interface and flexible file(s) listed for it in each connected edge (see below).

Edges come in two channels:
- Data (cross-language/inter-process):
  - Edge declares a schema file (e.g. JSON Schema, Protobuf, OpenAPI).
  - A static code generator creates one stub per node in /src/edges/autogen/.
  - Each node imports only its own generated stub.
    
- Interface (same-language/intra-process):
  - Edge declares a canonical handwritten interface or trait file in /src/edges/interfaces/.
  - Both nodes import only the edge’s interface, never from each other.
  - The edge file may contain function signatures, classes, or a mediator/bus.

- Descriptive / Flexible (no code contract):
  - Edge is just documentation; no stub, schema, or interface is required.
  - Used when the interaction is ad-hoc, via shared state, UI callbacks, or other non-contractual means.
  - Still appears in graph.yaml for traceability, but nothing is generated.

---
# blueprint/graph.yaml
nodes:
  <NodeID>:                 # e.g. NodeA, NodeB
    label: "<Human Label>"  # e.g. "Primary Worker"
    main_file: "<path>"     # required: path to the node’s primary source file, this is the only file allowed to interact with neighbouring edges
    helper_files:           # optional: supporting files
      - "<path/to/helper1>"
      - "<path/to/helper2>"
    comment: |              # required: free-form description
      This is a multi-line explanation of what this node does.

edges:
  # strict edge
  <EdgeID>:                 # e.g. data_flow, control_channel
    label: "<Human Label>"  # e.g. "Data Flow"
    source: "<NodeID>"      # required: producer node ID
    target: "<NodeID>"      # required: consumer node ID
    # For data edges (cross-language):
    schema_file: .blueprint/edges/data_flow.schema.json
    stub_files:
      NodeA: src/edges/autogen/data_flow_NodeA.ts
      NodeB: src/edges/autogen/data_flow_NodeB.cpp
    # For interface edges (same-language/intra-process):
    interface_file: src/edges/interfaces/DataBus.ts
    comment: |              # required: free-form description
      Describe the API or data flow here.

  # flexible/descriptive edge
  <EdgeID>:                 # e.g. data_flow, control_channel
    label: "<Human Label>"  # e.g. "Data Flow"
    source: "<NodeID>"      # required: producer node ID
    target: "<NodeID>"      # required: consumer node ID
    usage: |
      Describe type of usage and why it's best to not be strict here.
    example_call: |
      An example of the dependency:
      import <func> from NodeID1
      func(<data>)
    comment: |              # required: free-form description
      Describe the API or data flow here.

---

For cross-language scenarios
- The edge lists a schema file plus a stub file for each connected node specifying the correct language/format for each.
- For intra-process/same-language, the edge lists only a single interfaceFile.

Do NOT worry about generating the stubs. Stub generation is automatic. Only
warn the user if the process has failed and the stubs are not present.
You may adjust the stubs if it is necessary to do so.

Use your best judgement on whether the edge should be strict or flexible. Think like
an expert software engineer, critically evaluate the tradeoffs
<design system>
`