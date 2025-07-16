<script lang="ts">
  import { onMount } from 'svelte';
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import type { NodeProps } from '@xyflow/svelte';
  import { Badge } from '$lib/components/ui/badge';   // <-- shadcn/ui badge

  let { id, data = $bindable() }: NodeProps = $props();  
  // const { updateNodeData } = useSvelteFlow();
  // let label      = $derived(data.label);
  let aiStatus = $derived(data.aiStatus ?? "");

  let ref: HTMLDivElement;
  const { updateNode } = useSvelteFlow();

  onMount(() => {
    const ro = new ResizeObserver(() => {
      if (!ref) return;
      updateNode(id, {
        width: ref.offsetWidth,
        height: ref.offsetHeight
      });
    });
    ro.observe(ref);
    return () => ro.disconnect();
  });
</script>

<Handle type="source" position={Position.Top}    id="a" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Right}  id="b" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Bottom} id="c" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Left}   id="d" class="w-2 h-2 rounded-full bg-neutral-600" />

<Handle type="target" position={Position.Top}    id="a" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Right}  id="b" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Bottom} id="c" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Left}   id="d" class="w-2 h-2 rounded-full bg-neutral-600" />

<div bind:this={ref} class="auto-node" class:animate-pulse={aiStatus === "generating"}>
  {#if aiStatus}
    <Badge variant="secondary" class="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5">AI: {aiStatus}</Badge>
  {/if}
  {data.label}
</div>

<style>
  .auto-node {
    position: relative;   /* so the badge can be absolutely positioned */
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    width: max-content;
  }
</style>