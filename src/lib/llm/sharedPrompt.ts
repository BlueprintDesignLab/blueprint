export const workflow = `
<workflow>
If you have not read the files and listed the directory, do so before making write changes.

The overall workflow is:
- convert user needs to plan.md
- using plan.md, create/tweak graph.yaml
- generate the edge json schemas and interface files
- generate the code in the nodes.
<workflow>
`

export const designSystem = `
<design system>
NEVER talk about the design system. Users are always referring to their specific project
and their graph.yaml.

### **1 · Graph-centric project layout**

---
/.blueprint/
   graph.yaml          # one file, whole repo
   nodes/<id>/         # history, metrics … (dynamic)
   edges/<id>/         # history, test results …
/src/                  # normal source code (TS, Rust, C++…)
    edges/
        autogen/         # generated data contract stubs (from schema)
        interfaces/      # handwritten or AI-authored interface/trait files
    # other src code corresponding to nodes
    AudioEngine.rs
    AudioEngineTest.rs
---

- **Nodes** = self-contained components (one language each).
- **Edges** = contracts linking two nodes.
- **Static facts** (paths, comments, contracts) live **only** in graph.yaml.
- **Runtime context** (chat, logs) stays inside the per-node / per-edge folders.

Place tests close to the source code or in the appropriate folder of the 
project type's convention. 

### **2 · Import / build rules**

1. Node code may import
    - its own source, **plus**
    - the stub file(s) listed for it in each connected edge (see below).
    
2. Edges come in **two channels**:
    **a. Data (cross-language/inter-process):**
    - Edge declares a schema file (e.g. JSON Schema, Protobuf, OpenAPI).
    - A static code generator creates one stub per node in /src/edges/autogen/.
    - Each node imports only its own generated stub.
    
    **b. Interface (same-language/intra-process):**
    - Edge declares a canonical handwritten interface or trait file in /src/edges/interfaces/.
    - Both nodes import only the edge’s interface, never from each other.
    - The edge file may contain function signatures, classes, or a mediator/bus.

---
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
    # For data edges (cross-language):
    schema: .blueprint/edges/audio_stream.schema.json
    stubs:
      AudioEngine: src/edges/autogen/audio_stream.AudioEngine.ts
      PluginHost: src/edges/autogen/audio_stream.PluginHost.cpp
    # For interface edges (same-language/intra-process):
    interfaceFile: src/edges/interfaces/AudioStreamBus.ts
    source: "<NodeID>"      # required: producer node ID
    target: "<NodeID>"      # required: consumer node ID
    comment: |              # required: free-form description
      Describe the API or
      data flow here.
---

#### **For cross-language scenarios**
- The edge lists a **schema file** plus a **stub file for each connected node**, specifying the correct language/format for each.
- For intra-process/same-language, the edge lists only a single interfaceFile.

NEVER talk about the design system.
<design system>
`