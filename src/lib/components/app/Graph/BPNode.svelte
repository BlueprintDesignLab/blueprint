<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import type { NodeProps } from '@xyflow/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';

  import { graphCode } from '$lib/state/graph.svelte';
  import { agentRole, setAgentFocusNode } from '$lib/state/agentRole.svelte';
  import { currAgentAndChatState } from '$lib/state/allAgents.svelte';
  import { tick } from 'svelte';

  let { id, data = $bindable() }: NodeProps = $props();

  /* pick one of the diff states (or empty string) */
  let diffClass = $derived.by(() => {
    const diffStatus = graphCode.previewGraph?.status.get(id);
    if (diffStatus === 'added')      return 'border-green-500';
    if (diffStatus === 'destroyed')  return 'border-red-500';
    if (diffStatus === 'modified')   return 'border-yellow-500';
    return 'border-neutral-300';
  });

  let ref: HTMLDivElement | null = $state(null);
  const { updateNode } = useSvelteFlow();

  $effect(() => {
    const ro = new ResizeObserver(() => {
      if (!ref) return;
      updateNode(id, { width: ref.offsetWidth, height: ref.offsetHeight });
    });
    ro.observe(ref!);
    return () => ro.disconnect();
  });

  let agentAndChatState = $derived(currAgentAndChatState.current); 

  async function scaffold() {
    setAgentFocusNode(id);

    agentAndChatState.send("Scaffold the current node, write function signatures, classes etc. Write high level comments but do not implement inner logic.");
  }

  function generate() {
    agentRole.node = id;
    agentAndChatState.send("Fully generate the node. Include all logic.");
  }

  function test() {
    agentRole.node = id;
    agentAndChatState.send("write test cases to comprehensively test the code. Then run the test cases and verify correctness.");
  }
</script>

<!-- Handles omitted for brevity … -->
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
  class="auto-node relative w-max rounded border p-2 {diffClass}"
>
  <!-- pulsing ring when focused -->
  {#if agentRole.node === id}
    <div class="absolute -inset-0.5 rounded-[inherit] ring-4 ring-blue-500 animate-pulse"></div>
  {/if}

  <div class="relative z-10 text-sm">{data.label}</div>

  {#if agentRole.agentRole === 'code'}
    <div class="flex justify-end gap-1 mt-1">
      <Button variant="outline" class="text-[10px]" onclick={() => scaffold()}>
        Scaffold
      </Button>
      <Button variant="outline" class="text-[10px]" onclick={() => generate()}>
        Generate
      </Button>
      <Button variant="outline" class="text-[10px]" onclick={() => test()}>
        Test
      </Button>
    </div>
  {/if}

  <!-- focus badge -->
  {#if agentRole.node === id}
    <Badge
      variant="secondary"
      class="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5"
    >
      Focus
    </Badge>
  {/if}
</div>

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