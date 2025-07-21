<script lang="ts">
  // import { Agent } from "$lib/llm/agent";
  
  import { tick } from "svelte";

  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import { focus, setFocuNode, setFocusMode } from "$lib/state/focus.svelte";
  import { proposeCurrSrc, proposePlan } from "$lib/state/editor.svelte";

  import { StopCircle } from "lucide-svelte";

  import { contextWindow } from "$lib/state/contextWindow.svelte";
  
  import { toast } from "svelte-sonner";

  import ChRenderer from "./CHRenderer.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import { Agent } from "$lib/llm/agent/Agent";
  import type { UIUpdaterCallbacks } from "$lib/llm/agent/UIUpdater";

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

  function showTool(payload: any) {
    const index = ch.findIndex((obj: { id: any; }) => obj?.id === payload.id);

    if (index === -1) {
      if (ch.at(-1).content === "") {
        ch.pop();
      }

      ch.push(payload);
      scrollIfNearBottom();
      return;
    } 

    if ("delta" in payload) {
      ch[index].tool.arguments += payload.delta;
      console.log(ch[index].tool.arguments);
    } else {
      ch.push(payload);
    }

    scrollIfNearBottom();
  }

  export const dummyCallbacks: UIUpdaterCallbacks = {
    streamDelta,
    showTool,
    stopGenerating,
    updateMode:     () => { /* no-op */ },
    updateNode:     () => { /* no-op */ },
    updatePlan:     () => { /* no-op */ },
    updateGraph:    () => { /* no-op */ },
    updateCurrSrc:  () => { /* no-op */ },
  };


  let agents = {
    plan: new Agent({chat: [], tools: []}, "plan", dummyCallbacks),
    architect: new Agent({chat: [], tools: []}, "architect", dummyCallbacks),
    code: new Agent({chat: [], tools: []}, "code", dummyCallbacks),
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
        throw e;
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

<!-- wrap everything -->
<div class="flex flex-col h-screen">
  <!-- Tabs (fixed height) -->
  <Tabs.Root bind:value={focus.agentMode} class="">
    <Tabs.List
      class="w-full flex items-center gap-2 flex-nowrap
             border-b border-slate-200 px-3"
    >
      <Tabs.Trigger value="plan">Plan</Tabs.Trigger>
      <Tabs.Trigger value="architect">Architect</Tabs.Trigger>
      <Tabs.Trigger value="code">Code</Tabs.Trigger>
    </Tabs.List>
  </Tabs.Root>

  <!-- Inner panel: grows and scrolls -->
  <div class="flex flex-col flex-1 min-h-0 mx-auto max-w-2xl w-full p-4">
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
</div>

