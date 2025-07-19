<script lang="ts">
  import { Agent } from "$lib/llm/agent";
  
  import { tick } from "svelte";

  import { architectPrompt } from "$lib/llm/architect/prompt";
  import { architectTools } from "$lib/llm/architect/tools";

  import { codePrompt } from "$lib/llm/code/prompt";
  import { codeTools } from "$lib/llm/code/tools";

  import { plannerPrompt } from "$lib/llm/plan/prompt";
  import { plannerTools } from "$lib/llm/plan/tools";

  import { focus, setFocuNode, setFocusMode } from "$lib/state/focus.svelte";

  import { StopCircle } from "lucide-svelte";

  import { contextWindow } from "$lib/state/contextWindow.svelte";
  
  import { toast } from "svelte-sonner";

  import ChRenderer from "./CHRenderer.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { updateCurrSrc, updatePlan } from "$lib/state/editor.svelte";

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
    }

    scrollIfNearBottom();
  }

  let agents = {
    plan: new Agent([], [], plannerPrompt, plannerTools, streamDelta, showTool, stopGenerating, setFocusMode, setFocuNode, updatePlan, () => {}, updateCurrSrc),
    architect: new Agent([], [], architectPrompt, architectTools, streamDelta, showTool, stopGenerating, setFocusMode, setFocuNode, updatePlan, () => {}, updateCurrSrc),
    code: new Agent([], [], codePrompt, codeTools, streamDelta, showTool, stopGenerating, setFocusMode, setFocuNode, updatePlan, () => {}, updateCurrSrc)
  };

  let agent = $state(agents.plan);

  $effect(() => {
    focus.agentMode;

    agent = agents[focus.agentMode];
  })

  let controller = new AbortController();
  let generating = $state(false);

  const send = () => {
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

    (async () => {
      try {
        await agent.run(question, controller);
      } catch (e) {
        toast.error(String(e));
        streamDelta(String(e));
      }
    })();

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


<div class="flex flex-col h-screen mx-auto max-w-2xl w-full p-4">
  <!-- Status bar -->
  <p class="text-xs text-muted-foreground mb-2 shrink-0">
    | Mode: <span class="font-medium text-foreground">{focus.agentMode}</span>
    | Focus: <span class="font-medium text-foreground">{focus.node}</span>
    | Context: <span class="font-medium text-foreground">{contextWindow.length}</span>
  </p>

  <!-- Scrollable messages -->
  <div
    bind:this={chDiv}
    class="flex-1 overflow-y-auto space-y-3 px-2 py-3 bg-muted rounded-xl border"
  >
    <ChRenderer {ch} {approve} {reject} />
  </div>

  <!-- Input bar -->
  <div class="mt-4 flex items-end gap-2 shrink-0">
    <textarea
      bind:value={question}
      onkeydown={handleKeyDown}
      placeholder="Type your message…"
      class="flex-1 resize-none rounded border p-2 bg-background text-sm leading-snug
             focus:outline-none focus:ring-1 focus:ring-accent"
      rows="1"
      oninput={() => autoResize(textarea)}
      bind:this={textarea}
    ></textarea>

    {#if generating}
      <Button onclick={stopGenerating} size="sm"><StopCircle /></Button>
    {:else}
      <Button onclick={send} size="sm">Send</Button>
    {/if}
  </div>
</div>


