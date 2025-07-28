<script lang="ts">
  import { encoder } from "$lib/state/contextWindow.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import MdRenderer from "./MDRenderer.svelte";
  import CollapsibleArgs from "./CollapsibleArgs.svelte";

  let {ch, approve, reject} = $props();

</script>

{#each ch as chItem}
    {#if "tool" in chItem}
        {@const toolName = chItem.tool.name}
        {@const toolOutput = chItem.tool.output}
        {@const toolStatus = chItem.tool.status}
        {@const toolArgs = chItem.tool.args}

        {#snippet renderOutput(output: string)}
            Result:
            <pre class="min-w-0 text-sm text-slate-400 bg-slate-900 p-4 rounded overflow-x-auto">{output}</pre>
        {/snippet}

        <div class="bg-background border rounded-lg p-3 shadow-sm min-w-0">

        {#if toolName.includes("end_agentic_loop")}
            {#if toolStatus === "resolved"}
                <div class="font-semibold text-sm text-accent-foreground">
                {toolName}
                </div>
                {@render renderOutput(toolOutput)}
            {/if}
        {:else}
            <div class="font-semibold text-sm text-accent-foreground">
                {toolName}
            </div>
            <div class="text-xs text-gray-500">
                {toolStatus}
            </div>

            {#if toolStatus === "in_progress"}
                <CollapsibleArgs rawArgs={toolArgs} />

            {:else if toolStatus === "resolved"}
                <CollapsibleArgs rawArgs={toolArgs} />

                {@render renderOutput(toolOutput)}
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