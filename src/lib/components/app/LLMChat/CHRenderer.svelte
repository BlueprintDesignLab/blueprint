<script lang="ts">
  import { encoder } from "$lib/state/contextWindow.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import MdRenderer from "./MDRenderer.svelte";
  import CollapsibleArgs from "./CollapsibleArgs.svelte";
  import CollapsibleRow from "./CollapsibleRow.svelte";

  let {ch, approve, reject} = $props();

</script>

{#each ch as chItem}
    {#if "tool" in chItem}
        {@const toolName = chItem.tool.name}
        {@const toolOutput = chItem.tool.output}
        {@const toolStatus = chItem.tool.status}
        {@const toolArgs = chItem.tool.args}

        <div class="bg-background border rounded-lg p-3 shadow-sm min-w-0">

        {#if toolName.includes("end_agentic_loop")}
            {#if toolStatus === "resolved"}
                <div class="font-semibold text-sm text-accent-foreground overflow-x-auto">
                {toolName}
                </div>
                <CollapsibleRow key={"Result"} value={toolOutput}/>
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

                <CollapsibleRow key={"Result"} value={toolOutput}/>
            {/if}

            {#if "approvalId" in chItem}
                <Button onclick={() => {approve(chItem.approvalId); delete chItem.approvalId}}>Approve</Button>
                <Button variant="secondary" onclick={() => {reject(chItem.approvalId); delete chItem.approvalId}}>Reject</Button>
            {/if}
        {/if}
        </div>
    {:else}
        <div class="flex items-center justify-between text-xs text-gray-500">
            <span class="bg-gray-100 text-gray-800 px-2 py-1 rounded-md font-mono uppercase tracking-wide">
            {chItem.role}
            </span>
            <span class="text-gray-400 italic">
            Token Count: {encoder.encode(chItem.content).length}
            </span>
        </div>

        <div class="bg-background border rounded-lg p-3 shadow-sm mt-1">
            <MdRenderer content={chItem.content}/>
        </div>
    {/if}
{/each}