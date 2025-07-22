<script>
  import { encoder } from "$lib/state/contextWindow.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import MdRenderer from "./MDRenderer.svelte";

  let {ch, approve, reject} = $props();

</script>

{#each ch as chItem}
    {#if "tool" in chItem}
        {#if chItem.tool.name.includes("end_agentic_loop")}
            {#if chItem.tool.status === "resolved"}
            <div class="bg-background border rounded-lg p-3 shadow-sm">
                <div class="font-semibold text-sm text-accent-foreground">
                {chItem.tool.name}
                </div>
                <div class="bg-background border rounded-lg p-3 shadow-sm mt-1">
                    <MdRenderer content={chItem.tool.args} />
                </div>
                <div class="text-xs text-gray-500">
                    {chItem.tool.output.length > 400
                        ? chItem.tool.output.slice(0, 400) + '…'
                        : chItem.tool.output}
                </div>
            </div>
            {/if}
        {:else}
            <div class="bg-background border rounded-lg p-3 shadow-sm">

            <div class="font-semibold text-sm text-accent-foreground">
            {chItem.tool.name}
            </div>
            <div class="text-xs text-gray-500">
            {chItem.tool.status}
            </div>

            {#if chItem.tool.status === "in_progress"}
                <div class="bg-background border rounded-lg p-3 shadow-sm mt-1">
                    <MdRenderer content={String(chItem.tool.args)} />
                </div>

            {:else if chItem.tool.status === "resolved"}
                <div class="bg-background border rounded-lg p-3 shadow-sm mt-1">
                    <MdRenderer content={chItem.tool.output} />
                </div>
            {/if}

            {#if "approvalId" in chItem}
                <Button onclick={() => {approve(chItem.approvalId); delete chItem.approvalId}}>Approve</Button>
                <Button variant="secondary" onclick={() => {reject(chItem.approvalId); delete chItem.approvalId}}>Reject</Button>
            {/if}
            </div>

        {/if}
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