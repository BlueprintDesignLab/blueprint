<script lang="ts">
  import {
    SvelteFlow,
    Background,
    MiniMap,
    Controls,
    Panel,
    type NodeTypes,
    ConnectionLineType,
    type Connection,
    type Edge,
    type EdgeMarkerType,
    useNodes,
  } from "@xyflow/svelte";

  import LayerSelector from "$lib/components/LayerSelector.svelte";
  import C4FlowNode from "$lib/components/C4FlowNode.svelte";
  import C4FlowEdge from "$lib/components/C4FlowEdge.svelte";

  import { graphCode } from "$lib/state/graph.svelte";
  import NodeCreator from "./NodeCreator.svelte";
  import { DEFAULT_MARKEREND } from "$lib/util/graphIO";

  const edgeTypes = {
    c4FlowEdge: C4FlowEdge,
  };

  const nodeTypes: NodeTypes = { c4FlowNode: C4FlowNode };

  const nodes = useNodes();

  function onConnect(c: Connection): Edge | void {
    // console.log(c);
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

    // console.log(newEdge);
    return newEdge;
  }
</script>

<main>
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

    <!-- <Panel position="top-right">
      <LayerSelector />
    </Panel> -->

    <Panel position="top-left">
      <NodeCreator />
    </Panel>

    <Controls />
    <MiniMap
      nodeColor={(node) => {
        switch (node.data.type) {
          case "context":
            return "#6ede87";
          case "container":
            return "#6865A5";
          default:
            return "#ff0072";
        }
      }}
      zoomable
      pannable
    />
  </SvelteFlow>
</main>

<style>
  main {
    height: 100vh;
    display: flex;
    flex-direction: column-reverse;
  }
</style>
