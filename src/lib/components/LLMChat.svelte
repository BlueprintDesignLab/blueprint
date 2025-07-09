<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import MdRenderer from "./MDRenderer.svelte";

  import { Agent } from "$lib/llm/agent";
  
  import { onMount, tick } from "svelte";
  // import { workerPrompt } from "$lib/llm/worker/prompt";
  import { architectPrompt } from "$lib/llm/architect/prompt";
  // import { workerTools } from "$lib/llm/worker/tools";
  import { architectTools } from "$lib/llm/architect/tools";
  import { StopCircle } from "lucide-svelte";
  import { invoke } from "@tauri-apps/api/core";

  let ch: any = $state([]);
  let chDiv: HTMLDivElement | null = $state(null);

  let question = $state("");

  import { focus } from "$lib/state/focus.svelte";
  import { workerPrompt } from "$lib/llm/worker/prompt";
  import { workerTools } from "$lib/llm/worker/tools";

  function scroll() {
    tick().then(() => {
      chDiv = chDiv as HTMLDivElement;
      chDiv.scrollTo(0, chDiv.scrollHeight);
    });
  }

  function scrollIfNearBottom() {
    if (!chDiv) return;

    const TOLERANCE = 100;
    const autoscroll =
      chDiv.offsetHeight + chDiv.scrollTop > chDiv.scrollHeight - TOLERANCE;

    if (autoscroll) {
      scroll();
    }
  }

  // $effect.pre(() => {
  //   if (!ch[ch.length - 1]?.content) return;
  //   ch[ch.length - 1].content;

  //   if (!chDiv) return;

  //   const TOLERANCE = 100;
  //   const autoscroll =
  //     chDiv.offsetHeight + chDiv.scrollTop > chDiv.scrollHeight - TOLERANCE;

  //   if (autoscroll) {
  //     scroll();
  //   }
  // });

  function streamDelta(delta: string) {
    if (ch[ch.length-1].role != "assistant") {
      const responseRender = $state({
        role: "assistant",
        content: ""
      })

      ch.push(responseRender);
    }
    ch[ch.length - 1].content += delta;
    scrollIfNearBottom();
  }

  function showTool(tool: any) {
    ch.push(tool);
    scrollIfNearBottom();
  }

  let agent = new Agent([], [], architectPrompt, architectTools, streamDelta, showTool, stopGenerating);

  onMount(async () => {
    const dirTree = await invoke("list_directory_tree", {path: "."});
    let graphYaml = "";

    try {
      graphYaml = await invoke("read_file", {
        path: "./.blueprint/graph.yaml"
      }) as string;
    } catch(e) {}

    // console.log(dirTree);
    // console.log(graphYaml);

    const helper: ChatTurn = {
      role: "user",
      content: "\n<full directory tree>\n" + dirTree + "\n<full directory tree>\n" + "<graph.yaml>\n" + graphYaml + "<graph.yaml>\n"
    }
    // console.log(helper);

    agent = new Agent([], [], architectPrompt, architectTools, streamDelta, showTool, stopGenerating);
  })

  $effect(() => {
    focus.node;

    agent = new Agent([], [], workerPrompt + `\nYour focus is : ${focus.node}\n`, workerTools, streamDelta, showTool, stopGenerating);
  })

  let controller = new AbortController();
  let generating = $state(false);

  const send = async () => {
    if (generating) {
      stopGenerating();
    }

    const userMessage: ChatTurn = {
      role: "user",
      content: question
    }

    ch.push(userMessage);

    generating = true;
    controller = new AbortController();
    agent.run(question, controller);
    question = "";

    scroll();
  };

  function stopGenerating() {
    controller.abort();
    generating = false;
  }

  function approve(id: string) {
    agent.handleApproval(id, "approve");
  }

  function reject(id: string) {
    agent.handleApproval(id, null);
  }

  export function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter":
          if (!event.shiftKey) {
            event.preventDefault(); // Prevent the default Enter behavior (newline)
            send();
          }
          // If Shift is held, do nothing special: the default behavior will insert a newline
          if (event.shiftKey) {
            event.preventDefault(); // Prevent the default Enter behavior (newline)
            send();
          }
        break;
    }
  }
</script>


<div class="flex flex-col h-screen max-w-xl mx-auto p-4">
  Focus: {focus.node}

  <div bind:this={chDiv} class="flex-1 overflow-auto space-y-2 p-2 bg-muted rounded-xl border">
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

          {#if chItem.tool.status === "calling"}
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
        {chItem.role}
        <div class="bg-background border rounded-lg p-3 shadow-sm">
          <MdRenderer content={chItem.content}/>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Input area -->
  <div class="mt-4 flex items-center gap-2">
    <Input bind:value={question} onkeydown={(e) => handleKeyDown(e)} class="flex-1" placeholder="Type your message..."/>
    {#if generating}
      <Button onclick={stopGenerating}><StopCircle/></Button>
    {:else}
      <Button onclick={send}>send</Button>
    {/if}
  </div>
</div>


