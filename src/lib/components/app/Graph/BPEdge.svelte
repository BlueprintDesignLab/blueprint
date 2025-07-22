<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getBezierPath,
    useInternalNode,
    type EdgeProps,
  } from "@xyflow/svelte";
  
  import { getEdgeParams } from "$lib/util/edge";

  let { id, markerEnd, source, target, data }: EdgeProps =
    $props();

  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
 
  let [path, labelX, labelY] = $derived.by(() => {
    const edgeParams = getEdgeParams(sourceNode.current!, targetNode.current!);

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
</script>

<BaseEdge {id} {path} {markerEnd}/>
<EdgeLabel x={labelX} y={labelY} selectEdgeOnClick={true}>
  {#if data}
    {data.label}

    {#if "interfaceFile" in data}
      INTERFACE
    {/if}
  {/if}
</EdgeLabel> 
