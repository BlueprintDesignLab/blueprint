<script lang="ts">
  import { encoder } from "$lib/state/contextWindow.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import MdRenderer from "./MDRenderer.svelte";
  import CollapsibleArgs from "./CollapsibleArgs.svelte";
  import CollapsibleRow from "./CollapsibleRow.svelte";
  import { invoke } from "@tauri-apps/api/core";

  let {ch, approve, reject} = $props();

  async function resetProjectState(hash: string) {
    await invoke('restore_checkpoint', { hash });
  }
</script>

{#each ch as chItem (chItem)}
  <div class="bg-background border rounded-lg p-3 shadow-sm min-w-0 my-4">

  {#if chItem.kind === "tool"}
    {@const tool = chItem.tool}
    {@const toolName   = tool?.name   ?? ""}
    {@const toolOutput = tool?.output ?? ""}
    {@const toolStatus = tool?.status ?? "unknown"}
    {@const toolArgs   = tool?.arguments ?? tool?.args ?? ""}

      {#if toolName.includes("end_agentic_loop")}
        {#if toolStatus === "resolved"}
          <div class="font-semibold text-sm text-accent-foreground overflow-x-auto">
            {toolName}
          </div>
          <CollapsibleRow key="Result" value={toolOutput} />
        {/if}
      {:else}
        <div class="font-semibold text-sm text-accent-foreground overflow-x-auto">
          {toolName}
        </div>
        <div class="text-xs text-gray-500 overflow-x-auto">
          {toolStatus}
        </div>

        {#if toolStatus === "in_progress"}
          <CollapsibleArgs rawArgs={toolArgs} />
        {:else if toolStatus === "resolved"}
          <CollapsibleArgs rawArgs={toolArgs} />
          <CollapsibleRow key="Result" value={toolOutput} />
        {/if}

        {#if chItem.approvalId}
          <Button onclick={() => approve(chItem)}>Approve</Button>
          <Button variant="secondary" onclick={() => reject(chItem)}>Reject</Button>
        {/if}

        <div class="flex justify-end">
          {#if chItem.checkpoint !== undefined}
            <Button
              variant="destructive"
              class="bg-red-400"
              onclick={() => resetProjectState(chItem.checkpoint)}
            >
              Restore project state
            </Button>
          {/if}
        </div>
      {/if}

  {:else}
    <div class="flex items-center justify-between text-xs text-gray-500">
      <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-md font-mono uppercase tracking-wide">
        {chItem.kind}
      </span>
      <span class="text-gray-400 italic">
        Token Count: {encoder.encode(chItem.content).length}
      </span>
    </div>

      <MdRenderer content={chItem.content} />
  {/if}
  </div>
{/each}