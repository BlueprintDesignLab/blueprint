<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import ChRenderer from "./CHRenderer.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import SettingsDialog from "$lib/components/settings/SettingsDialog.svelte";

  import { tick } from "svelte";
  import { agentRole } from "$lib/state/agentRole.svelte";
  import { StopCircle } from "lucide-svelte";
  import { contextWindow } from "$lib/state/contextWindow.svelte";
  import { toast } from "svelte-sonner";
  
  import { Agent } from "$lib/llm/agent/Agent";

  import type { UIUpdaterCallbacks } from "$lib/llm/agent/StreamHandler";

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
    if (autoscroll) scroll();
  }

  function chAssistant() {
    if (ch[ch.length - 1]?.role !== "assistant") {
      ch.push({ role: "assistant", content: "" });
    }
  }

  function streamDelta(delta: string) {
    chAssistant();
    ch.at(-1).content += delta;
    scrollIfNearBottom();
  }

  function showTool(payload: any) {
    const index = ch.findIndex((obj: { id: any }) => obj?.id === payload.id);
    if (index === -1) {
      if (ch.at(-1)?.content === "") ch.pop();
      ch.push(payload);
      scrollIfNearBottom();
      return;
    }
    if ("delta" in payload) {
      ch[index].tool.args += payload.delta;
    } else {
      ch[index] = payload;
    }
    scrollIfNearBottom();
  }

  export const dummyCallbacks: UIUpdaterCallbacks = {
    streamDelta,
    showTool,
    stopGenerating,
  };

  let agents = {
    plan: new Agent({ chat: [], tools: [] }, "plan", dummyCallbacks),
    architect: new Agent({ chat: [], tools: [] }, "architect", dummyCallbacks),
    code: new Agent({ chat: [], tools: [] }, "code", dummyCallbacks),
  };

  let agent = $state(agents.plan);
  $effect(() => {
    agentRole.agentRole;
    agent = agents[agentRole.agentRole];
  });

  let controller = new AbortController();
  let generating = $state(false);

  const send = () => {
    if (generating) stopGenerating();
    const userMessage = { role: "user", content: $state.snapshot(question) };
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
    tick().then(() => autoResize(textarea));
    
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

  async function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;

    await tick();                   // wait for Svelte to flush
    await new Promise(r => requestAnimationFrame(r)); // wait for browser layout

    el.style.height = "auto";       // collapse to natural height
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  export function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) {
        // allow newline
      } else {
        send();
      }
    }
  }
</script>

<!-- full-height flex wrapper -->
<div class="flex flex-col h-screen">
  <!-- fixed-height header -->
  <header class="flex items-center gap-4 px-4 py-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
    <span class="text-xs font-medium text-foreground">
      Mode: {agentRole.agentRole}
      <span class="mx-2 text-muted-foreground">·</span>
      agentRole: {agentRole.node}
      <span class="mx-2 text-muted-foreground">·</span>
      Context: {contextWindow.length}
    </span>

    <div class="ml-auto">
      <SettingsDialog />
    </div>
  </header>

  <!-- takes all remaining height -->
  <main class="flex flex-col flex-1 overflow-hidden">
    <div class="flex flex-col flex-1 min-h-0 mx-auto max-w-2xl w-full p-4">
      <!-- Scrollable messages -->
      <div
        bind:this={chDiv}
        class="flex-1 overflow-y-auto space-y-3 px-2 py-3 bg-muted rounded-xl border"
      >
        <ChRenderer {ch} {approve} {reject} />
      </div>

      <!-- Tabs + Input -->
      <div class="mt-4 shrink-0">
        <Tabs.Root bind:value={agentRole.agentRole}>
          <Tabs.List
            class="w-full flex items-center gap-2 flex-nowrap border-b border-slate-200 dark:border-slate-700 mb-2"
          >
            <Tabs.Trigger value="plan">Plan</Tabs.Trigger>
            <Tabs.Trigger value="architect">Architect</Tabs.Trigger>
            <Tabs.Trigger value="code">Develop</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        <div class="flex items-end gap-2">
          <textarea
            bind:value={question}
            onkeydown={handleKeyDown}
            placeholder="Type your message…"
            class="flex-1 resize-none rounded border p-2 bg-background text-sm leading-snug
                   agentRole:outline-none agentRole:ring-1 agentRole:ring-accent"
            rows="1"
            style="min-height: 2.5rem; max-height: 160px;"
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
  </main>
</div>