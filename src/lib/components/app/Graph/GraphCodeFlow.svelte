<script lang="ts">
  import {
    SvelteFlow,
    Background,
    MiniMap,
    Controls,
    ConnectionLineType,

    type Node,
    type NodeTypes,
    type Connection,
    type Edge,
    type EdgeMarkerType,

    useNodes,
    Panel,
  } from "@xyflow/svelte";

  import BPNode from "$lib/components/app/Graph/BPNode.svelte";
  import BPEdge from "$lib/components/app/Graph/BPEdge.svelte";

  import { DEFAULT_MARKEREND, saveGraphView, type MergedGraph } from "$lib/util/graphIO";
  import { graphCode } from "$lib/state/graph.svelte";

  // let { nodes = $bindable(), edges = $bindable() }: MergedGraph = $props();

  const edgeTypes = {
    bpEdge: BPEdge,
  };

  const nodeTypes: NodeTypes = { bpNode: BPNode };

  const sfNodes = useNodes();

  function onConnect(c: Connection): Edge | void {
    const id = `${c.source}-${c.target}`;
    
    const source = sfNodes.current.find(n => n.id === c.source)!;
    const target = sfNodes.current.find(n => n.id === c.target)!;

    const newEdge = {
      id,
      source: c.source,
      target: c.target,
      type: "bpEdge",
      animated: true,
      zIndex: 1,
      markerEnd: DEFAULT_MARKEREND as EdgeMarkerType,
      data: {}
    }

    return newEdge;
  }

  let nodes = $derived(graphCode.nodes);
  let edges = $derived(graphCode.edges);

  function patchNode(updatedNodes: {targetNode: Node}) {
    // // console.log(updatedNodes);
    const { targetNode } = updatedNodes;
    if (!targetNode) return;

    const newView = saveGraphView({nodes, edges});

    graphCode.viewStr = newView;
  }
</script>

<SvelteFlow
  bind:nodes
  bind:edges
  fitView
  onnodedragstop={(e) => patchNode(e as {targetNode: Node})}
  {nodeTypes}
  {edgeTypes}
  connectionLineType={ConnectionLineType.Straight}
  onbeforeconnect={(d) => {
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