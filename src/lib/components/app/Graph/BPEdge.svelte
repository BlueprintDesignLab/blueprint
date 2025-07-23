<!-- CustomEdge.svelte -->
<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getBezierPath,
    useInternalNode,
    type EdgeProps,
  } from "@xyflow/svelte";

  import { getEdgeParams } from "$lib/util/edge";
  import { graphCode } from "$lib/state/graph.svelte";

  let { id, markerEnd, source, target, data }: EdgeProps = $props();

  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  let [path, labelX, labelY] = $derived.by(() => {
    const ep = getEdgeParams(sourceNode.current!, targetNode.current!);
    return getBezierPath({
      sourceX: ep.sx,
      sourceY: ep.sy,
      sourcePosition: ep.sourcePos,
      targetPosition: ep.targetPos,
      targetX: ep.tx,
      targetY: ep.ty,
    });
  });

  /* ---------- diff colour ---------- */
  const diffColour = $derived.by(() => {
    const status = graphCode.previewGraph?.status.get(id);
    switch (status) {
      case "added":    return "#22c55e"; // green-500
      case "destroyed":return "#ef4444"; // red-500
      case "modified": return "#eab308"; // yellow-500
      default:         return "#64748b"; // neutral-500
    }
  });

  /* ---------- interface vs schema ---------- */
  const isInterface = $derived(data?.interfaceFile != null);
</script>

<BaseEdge
  {id}
  {path}
  {markerEnd}
  style={`stroke:${diffColour};stroke-width:3;stroke-dasharray:${isInterface ? 'none' : '8 4'}`}
/>

<EdgeLabel x={labelX} y={labelY} selectEdgeOnClick>
  {#if data}
    {data.label}
  {/if}
</EdgeLabel>