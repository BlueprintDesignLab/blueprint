<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';

  import type { NodeProps } from '@xyflow/svelte';
  import { Badge } from '$lib/components/ui/badge';

  import { graphCode } from '$lib/state/graph.svelte';

  import { onMount } from 'svelte';
  import { getDeveloperAgentForNode } from '$lib/state/allAgents.svelte';

  let { id, data = $bindable() }: NodeProps = $props();

  /* pick one of the diff states (or empty string) */
  let diffClass = $derived.by(() => {
    let diffStatus = graphCode.previewGraph?.status.get(id);

    if (diffStatus === "added")    return 'border-green-500';
    if (diffStatus === "destroyed") return 'border-red-500';
    if (diffStatus === "modified")  return 'border-yellow-500';
    return 'border-neutral-300';
  });

  let agentAndChatState = getDeveloperAgentForNode(id);
  // let generating = $derived(agentAndChatState.generating ?? false);

  let ref: HTMLDivElement | null = $state(null);
  const { updateNode } = useSvelteFlow();
  
  onMount(() => {
    const ro = new ResizeObserver(() => {
      if (!ref) return;
      updateNode(id, {
        width: ref.offsetWidth,
        height: ref.offsetHeight
      });
    });
    
    ro.observe(ref!);
    return () => ro.disconnect();
  });
</script>

<!-- … same Handles … -->
<Handle type="source" position={Position.Top}    id="a" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Right}  id="b" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Bottom} id="c" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Left}   id="d" class="w-2 h-2 rounded-full bg-neutral-600" />

<Handle type="target" position={Position.Top}    id="a" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Right}  id="b" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Bottom} id="c" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Left}   id="d" class="w-2 h-2 rounded-full bg-neutral-600" />

<div
  bind:this={ref}
  class="auto-node border-2 {diffClass} w-24"
>
  <!-- {#if generating}
    <Badge variant="secondary" class="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5">
      AI: Generating
    </Badge>
  {/if} -->
  {data.label}
</div>

  <!-- class:animate-pulse={generating} -->


<style>
  .auto-node {
    position: relative;
    padding: 8px 12px;
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    width: max-content;
  }
</style>