<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getStraightPath,
    getBezierPath,
    getSmoothStepPath,
    type EdgeProps,
    useNodes,
    useInternalNode,
  } from "@xyflow/svelte";
  
  import { getEdgeParams } from "$lib/util/edge";

  let { id, markerEnd, source, target, data }: EdgeProps =
    $props();

  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
 
  let [path, labelX, labelY] = $derived.by(() => {
    // console.log(sourceNode, targetNode);
    const edgeParams = getEdgeParams(sourceNode.current!, targetNode.current!);
    // console.log(edgeParams);

    const calc = getBezierPath({
      sourceX: edgeParams.sx,
      sourceY: edgeParams.sy,
      sourcePosition: edgeParams.sourcePos,
      targetPosition: edgeParams.targetPos,
      targetX: edgeParams.tx,
      targetY: edgeParams.ty,
    })

    return calc;
  });

  ;

  // let [edgePath, labelX, labelY] = $derived(
  //   getStraightPath({
  //     sourceX,
  //     sourceY,
  //     targetX,
  //     targetY,
  //   })
  // );
</script>

<BaseEdge {id} {path} {markerEnd}/>
<EdgeLabel x={labelX} y={labelY} selectEdgeOnClick={true}>
  {#if data}
    {data.label}

    {#if "interfaceFile" in data}
      INTERFACE
    {/if}
    <!-- {data.comment} -->
    <!-- {#if sourceNode.current!.data.type === "context"}
      <ContextEdgeLabel {id} {data} />
    {:else if sourceNode.current!.data.type === "container"}
      <ContainerEdgeLabel {data} />
    {:else if sourceNode.current!.data.type === "component"}
      <ComponentEdgeLabel {data} />
    {:else if sourceNode.current!.data.type === "code"}
      <CodeEdgeLabel {data} />
    {/if} -->
  {/if}

  <!-- <button
    class="nodrag nopan"
    onclick={() => {
      edges.update((eds) => eds.filter((edge) => edge.id !== id));
    }}
  >
    delete
  </button> -->
</EdgeLabel> 
