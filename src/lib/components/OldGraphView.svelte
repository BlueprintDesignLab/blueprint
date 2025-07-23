<script lang="ts">
  import {
    SvelteFlow,
    Background,
    MiniMap,
    Controls,
    ConnectionLineType,

    type NodeTypes,
    type Connection,
    type Edge,
    type EdgeMarkerType,

    useNodes,
    Panel,
  } from "@xyflow/svelte";

  import C4FlowNode from "$lib/components/app/C4FlowNode.svelte";
  import C4FlowEdge from "$lib/components/app/C4FlowEdge.svelte";

  import { graphCode } from "$lib/state/graph.svelte";
  import { DEFAULT_MARKEREND } from "$lib/util/graphIO";

  const edgeTypes = {
    c4FlowEdge: C4FlowEdge,
  };

  const nodeTypes: NodeTypes = { c4FlowNode: C4FlowNode };

  const nodes = useNodes();

  function onConnect(c: Connection): Edge | void {
    const id = `${c.source}-${c.target}`;
    
    const source = nodes.current.find(n => n.id === c.source)!;
    const target = nodes.current.find(n => n.id === c.target)!;

    if (source.data.type != target.data.type) {
      alert("Can't connect between different layers");
      return;
    }

    const newEdge = {
      id,
      source: c.source,
      target: c.target,
      type: "c4FlowEdge",
      animated: true,
      zIndex: 1,
      markerEnd: DEFAULT_MARKEREND as EdgeMarkerType,
      data: {}
    }

    return newEdge;
  }
</script>


<SvelteFlow
  bind:nodes={graphCode.nodes}
  bind:edges={graphCode.edges}
  fitView
  {nodeTypes}
  {edgeTypes}
  connectionLineType={ConnectionLineType.Straight}
  onbeforeconnect={(d) => {
    // return false;
    return onConnect(d);
  }}
>

  <Background />

  <Controls />
  <MiniMap
    zoomable
    pannable
  />
</SvelteFlow>