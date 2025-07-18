<script>
  import { encoder } from "$lib/state/contextWindow.svelte";
  import Button from "../ui/button/button.svelte";
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
            <div class="text-xs text-gray-500">
            {chItem.tool.output}
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
        <!-- <pre class="text-sm whitespace-pre-wrap break-words bg-muted border rounded p-2 max-h-60 overflow-auto">
            {chItem.tool.arguments}
        </pre> -->
            <MdRenderer content={"```" + chItem.tool.arguments + "```"} />
        {:else if chItem.tool.status === "calling"}
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {#each Object.entries(chItem.tool.arguments) as [key, value]}
            {#if key === "content"}
                <!-- full-width, scrollable Markdown block -->
                <div class="col-span-2">
                <div class="max-h-60 overflow-auto rounded border bg-muted p-2">
                    <MdRenderer content={"```" + value + "```"} />
                </div>
                </div>
            {:else}
                <dt class="font-medium text-gray-700 min-w-[6rem]">{key}</dt>
                <dd class="text-gray-600 break-words">{value}</dd>
            {/if}
            {/each}
        </dl>

        {:else if chItem.tool.status === "resolved"}
        <pre class="text-sm whitespace-pre-wrap break-words bg-muted border rounded p-2 max-h-60 overflow-auto">
            {chItem.tool.output}
        </pre>
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