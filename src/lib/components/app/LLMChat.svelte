<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";

  import MdRenderer from "./MDRenderer.svelte";

  import { Agent } from "$lib/llm/agent";
  
  import { tick } from "svelte";

  import { architectPrompt } from "$lib/llm/architect/prompt";
  import { architectTools } from "$lib/llm/architect/tools";

  import { workerPrompt } from "$lib/llm/worker/prompt";
  import { workerTools } from "$lib/llm/worker/tools";

  import { focus } from "$lib/state/focus.svelte";

  import { StopCircle } from "lucide-svelte";

  import { contextWindow, encoder } from "$lib/state/contextWindow.svelte";
  import { plannerPrompt } from "$lib/llm/planner/prompt";
  import { plannerTools } from "$lib/llm/planner/tools";

  let ch: any = $state([]);
  let chDiv: HTMLDivElement | null = $state(null);

  let question = $state("");

  function scroll() {
    tick().then(() => {
      chDiv = chDiv as HTMLDivElement;
      chDiv.scrollTo(0, chDiv.scrollHeight);
    });
  }

  function scrollIfNearBottom() {
    if (!chDiv) return;

    const TOLERANCE = 50;
    const autoscroll =
      chDiv.offsetHeight + chDiv.scrollTop > chDiv.scrollHeight - TOLERANCE;

    if (autoscroll) {
      scroll();
    }
  }

  function chAssistant() {
    if (ch[ch.length-1].role != "assistant") {
      const responseRender = {
        role: "assistant",
        content: ""
      };

      ch.push(responseRender);
    }
  }

  function streamDelta(delta: string) {
    chAssistant();
    ch.at(-1).content += delta;
    scrollIfNearBottom();
  }

  function showTool(tool: any) {
    const index = ch.findIndex((obj: { id: any; }) => obj?.id === tool.id);

    if (index === -1) {
      if (ch.at(-1).content === "") {
        ch.pop();
      }

      ch.push(tool);
      scrollIfNearBottom();
      return;
    } 

    if ("delta" in tool) {
      ch[index].tool.arguments += tool.delta;
    } else {
      ch.push(tool);
      // ch[index] = tool;
    }
  }

  let agents = {
    plan: new Agent([], [], plannerPrompt, plannerTools, streamDelta, showTool, stopGenerating),
    architect: new Agent([], [], architectPrompt, architectTools, streamDelta, showTool, stopGenerating),
    implement: new Agent([], [], workerPrompt + `\nYour focus is : ${focus.node}\n`, workerTools, streamDelta, showTool, stopGenerating)
  };

  let agent = $state(agents.plan);

  $effect(() => {
    focus.mode;

    agent = agents[focus.mode];
  })

  $effect(() => {
    focus.node;
    agents.implement = new Agent([], [], workerPrompt + `\nYour focus is : ${focus.node}\n`, workerTools, streamDelta, showTool, stopGenerating);
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
    chAssistant();

    generating = true;
    controller = new AbortController();
    agent.run(question, controller);
    question = "";

    tick().then(() => {
      autoResize(textarea);
    })

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

  let textarea: HTMLTextAreaElement | null = $state(null);

  function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
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
            event.preventDefault();
            send();
          }
        break;
    }
  }
</script>


<div class="flex flex-col h-screen max-w-xl mx-auto p-4">
  Focus: {focus.node} Context Window: {contextWindow.length}

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

          {#if chItem.tool.status === "in_progress"}
            <pre class="text-sm whitespace-pre-wrap break-words bg-muted border rounded p-2 max-h-60 overflow-auto">
              {chItem.tool.arguments}
            </pre>
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
  </div>

  <!-- Input area -->
  <div class="mt-4 flex items-center gap-2">
    <textarea
      bind:value={question}
      onkeydown={handleKeyDown}
      placeholder="Type your message..."
      class="flex-1 resize-none overflow-hidden rounded border p-2 bg-background text-sm leading-relaxed focus:outline-none focus:ring focus:border-accent transition-all"
      rows="1"
      oninput={() => autoResize(textarea)}
      bind:this={textarea}
    ></textarea>
    {#if generating}
      <Button onclick={stopGenerating}><StopCircle/></Button>
    {:else}
      <Button onclick={send}>send</Button>
    {/if}
  </div>
</div>


