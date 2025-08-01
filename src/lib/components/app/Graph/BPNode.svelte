<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';
  import type { NodeProps } from '@xyflow/svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';

  import { graphCode } from '$lib/state/graph.svelte';

  import { agentRole, setAgentFocusNode } from '$lib/state/agentRole.svelte';
  import { getDeveloperAgentForNode } from '$lib/state/allAgents.svelte';
  import { tick } from 'svelte';
  import { Unlock, Lock } from 'lucide-svelte';
  import { parse, stringify } from 'yaml';

  let { id, data = $bindable() }: NodeProps = $props();

  /* pick one of the diff states (or empty string) */
  let diffClass = $derived.by(() => {
    const diffStatus = graphCode.previewGraph?.status.get(id);
    if (diffStatus === 'added')      return 'border-green-500';
    if (diffStatus === 'destroyed')  return 'border-red-500';
    if (diffStatus === 'modified')   return 'border-yellow-500';
    return 'border-neutral-300';
  });

  let ref: HTMLButtonElement | null = $state(null);
  const { updateNode } = useSvelteFlow();

  $effect(() => {
    data.label; // read it so the effect re-runs
    tick().then(() => {
      if (ref) updateNode(id, { width: ref.offsetWidth, height: ref.offsetHeight });
    });
  });

  function generate() {
    setAgentFocusNode(id);
    let agentAndChatState = getDeveloperAgentForNode(id); 

    agentAndChatState.send("Fully generate the node. Include all logic.");
  }

  function test() {
    setAgentFocusNode(id);
    let agentAndChatState = getDeveloperAgentForNode(id); 

    agentAndChatState.send("write test cases to comprehensively test the code. Then run the test cases and verify correctness.");
  }

  function select() {
    setAgentFocusNode(id);
  }

  // action: flip the lock flag for one node
  function toggleNodeLock(nodeId: string) {
    const doc: any = parse(graphCode.graphStr);          
    if (doc?.nodes?.[nodeId]) {
      const node = doc.nodes[nodeId];
      node.locked = !node.locked;
      
      const newGraphStr = stringify(doc);
      console.log(newGraphStr);
      graphCode.graphStr = newGraphStr;
    }
  }

  let isLocked = $derived(data.locked ?? false);

  // function selectNode() {
  //   graphCode.setSelectedNodesEdges([id], []);
  // }
</script>


<Handle type="source" position={Position.Top}    id="a" />
<Handle type="source" position={Position.Right}  id="b" />
<Handle type="source" position={Position.Bottom} id="c" />
<Handle type="source" position={Position.Left}   id="d" />
<Handle type="target" position={Position.Top}    id="a" />
<Handle type="target" position={Position.Right}  id="b" />
<Handle type="target" position={Position.Bottom} id="c" />
<Handle type="target" position={Position.Left}   id="d" />

<!-- inside the node -->
<button
  bind:this={ref}
  class="auto-node relative w-max rounded border p-2 {diffClass}"
>
  <!-- locked indicator -->
  {#if isLocked}
    <Lock
      size={12}
      class="absolute top-1 left-1 text-red-600"
      aria-label="locked"
    />
  {/if}

  {#if agentRole.node === id}
    <div
      class="absolute -inset-0.5 rounded-[inherit] ring-4 ring-blue-500 animate-pulse pointer-events-none"
    ></div>
  {/if}

  <div class="relative z-10 text-sm">{data.label}</div>

  {#if agentRole.agentRole === 'code'}
    <div class="flex justify-end gap-1 mt-1">
      <Button variant="secondary" class="text-[10px]" onclick={select}>
        Select
      </Button>

      <!-- lock/unlock toggle -->
      <Button
        variant="outline"
        class="text-[10px] flex items-center gap-1"
        onclick={() => toggleNodeLock(id)}
      >
        {#if isLocked}
          <Unlock size={10} />
          Unlock
        {:else}
          <Lock size={10} />
          Lock
        {/if}
      </Button>

      <Button variant="outline" class="text-[10px]" onclick={generate}>
        Generate
      </Button>
      <Button variant="outline" class="text-[10px]" onclick={test}>
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
</button>

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