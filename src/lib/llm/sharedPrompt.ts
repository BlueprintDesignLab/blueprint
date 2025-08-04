export const workflow = `
<overall workflow>
<IMPORTANT>
Always ask one question at a time to not overwhelm the user.
Generally, list directory, then read file to understand the current project state first.
Be concise.
<IMPORTANT>

Always give the full path relative to the project root.

If the output of a tool is "not approved", ask for how to improve the request.

The overall workflow is:
- 'plan' agent convert user needs to plan.md
- 'architect' agent using plan.md, create/tweak graph.yaml
- 'code' agent scaffold the entire project
- 'code' node worker agents generate the full code in the nodes.
<overall workflow>
`

export const validGraphStructure = `
<base yaml constraints>
The below fields are compulsory for valid graph parsing.
Additional fields are included in design system for stricter workflows.

# /.blueprint/graph.yaml
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

/src/ # normal source code (TS, Rust, C++…) <IMPORTANT> For paths, respect the conventions of the stack. <IMPORTANT>
---

Nodes = self-contained components (one language each).
Edges = contracts or dependency linking two nodes.
Static facts (paths, comments, contracts) live only in graph.yaml.
Runtime context (chat, logs) stays inside the per-node / per-edge folders.

### Import / build rules

Node code may import
- its own source, and any helper files
- the stub, interface and flexible file(s) listed for it in each connected edge (see below).
- helper files may only be imported by the main file
- imports across flexible edges are unregulated and allowed

Edges come in two channels:
- Data (cross-language/inter-process):
  - Edge declares a schema file (e.g. JSON Schema, Protobuf, OpenAPI).
  - A static code generator creates one stub per node in /src/edges/autogen/.
  - Each node imports only its own generated stub.
    
- Interface (same-language/intra-process):
  - Edge declares a canonical handwritten interface or trait file in /src/edges/interfaces/.
  - Both nodes import only the edge’s interface, never from each other.
  - The edge file may contain function signatures, classes, or a mediator/bus.

- Flexible (no code contract):
  - Edge is just documentation; no stub, schema, or interface is required.
  - Used when the interaction is ad-hoc, lightweight, via shared state, UI callbacks, or other non-contractual means.
  - Still appears in graph.yaml for traceability, but nothing is generated.

<IMPORTANT>
For all paths, respect the conventions of the tech stack.
<IMPORTANT>
___
# blueprint/graph.yaml
nodes:
  <NodeID>:                 # e.g. NodeA, NodeB
    label: <Human Label>    # e.g. Primary Worker
    main_file: <path>       # required: path to the node’s primary source file, this is the only file allowed to interact with other nodes/edges
    helper_files:           # optional: supporting files. Keep all files to less than 500 lines of code. split into helpers if necessary. 
      - <path>
      - <path>
    responsibility:         # the main responsibility of the component
    comment:                # optional: free-form explanation of what this node does

edges:
  # schema edge
  <EdgeID>:                 # e.g. data_flow, control_channel
    kind: schema
    source: <NodeID>        # required: producer node ID
    target: <NodeID>        # required: consumer node ID
    # For data edges (cross-language):
    schema_file: <path>
    stub_files:
      NodeA: <path>
      NodeB: <path>
    responsibility:         # the main responsibility of the component
    comment:                # optional: free-form description

  # interface edge
  <EdgeID>:                
    kind: interface
    source: <NodeID>      
    target: <NodeID>     
    # For interface edges (same-language/intra-process):
    interface_file: <path>
    responsibility:         # the main responsibility of the component
    comment:                # optional: free-form description

  # flexible edge
  <EdgeID>:              
    kind: flexible
    source: <NodeID>      
    target: <NodeID>      
    usage: |
      Describe type of usage and why it's best to not be strict here.
    all calls: # an exhaustive list of the dependencies between the two nodes.
      - <class>.<func>() in source
    responsibility:         # the main responsibility of the component
    comment:                # optional: free-form description
___

For cross-language scenarios
- The edge lists a schema file plus a stub file for each connected node specifying the correct language/format for each.
- For intra-process/same-language, the edge lists only a single interfaceFile.

Do NOT worry about generating the stubs. Stub generation is automatic. Only
warn the user if the process has failed and the stubs are not present.
You may adjust the stubs if it is necessary to do so.

Use your best judgement on whether the edge should be strict or flexible. Think like
an expert software engineer, critically evaluate the tradeoffs. In the initial stage
of the project, favour flexible for simplicity.
<design system>
`