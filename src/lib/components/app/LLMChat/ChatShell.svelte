<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import ChRenderer from "./CHRenderer.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import SettingsDialog from "$lib/components/settings/SettingsDialog.svelte";

  import { tick } from "svelte";
  import { agentRole } from "$lib/state/agentRole.svelte";
  import { Code, StopCircle } from "lucide-svelte";
  import { contextWindow, encoder } from "$lib/state/contextWindow.svelte";

  import { toast } from "svelte-sonner";

  let { ch, generating, agent } = $props();
  let chDiv: HTMLDivElement | null = $state(null);

  let question = $state("");

  $effect(() => {
    ch;
    scrollIfNearBottom();
  })

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

  const send = () => {
    if (generating) stopGenerating();
    const userMessage = { role: "user", content: $state.snapshot(question) };
    ch.push(userMessage);

    // chAssistant();
    generating = true;
    (async () => {
      try {
        await agent.run(question);
      } catch (e) {
        toast.error(String(e));
        // streamDelta(String(e));
        throw e;
      }
    })();

    question = "";
    tick().then(() => autoResize(textarea));
  };

  function stopGenerating() {
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

  $inspect(ch);
</script>

<!-- full-height flex wrapper -->
<div class="flex flex-col h-screen">
  <!-- fixed-height header -->
  <header
  class="flex items-center gap-4 px-4 py-2 border-b border-slate-200 dark:border-slate-700 shrink-0"
  >
    <span class="text-xs font-medium text-foreground">
        Role: {agentRole.agentRole}
        <span class="mx-2 text-muted-foreground">·</span>
        Context: {encoder.encode(JSON.stringify(ch)).length}
        <span class="mx-2 text-muted-foreground">·</span>
        <br/>
        <span class="text-xs text-muted-foreground">Each agent has its own memory</span>
    </span>

    <div class="ml-auto">
        <SettingsDialog />
    </div>
  </header>

  <!-- takes all remaining height -->
  <main class="flex flex-col flex-1 overflow-hidden">
    <div class="flex flex-col flex-1 min-h-0 mx-auto max-w-2xl w-full p-4">
      <div
        bind:this={chDiv}
        class="flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-6 py-5"
      >
        {#if agentRole.agentRole === "code" && agentRole.node === ""}
          <div class="flex flex-col items-center justify-center h-full text-center">
            <div
              class="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            >
              <Code />
            </div>

            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">
              Select a node to focus on
            </h3>

            <p class="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-xs">
              Each node keeps its own context so the LLM never gets confused.
            </p>

            <p class="mt-4 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Psssssss: you can generate multiple nodes at once!
            </p>
          </div>
        {:else}
          <div class="flex flex-col h-full">
            <div
              class="shrink-0 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            >
              <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
                Coding node: <span class="font-mono">{agentRole.node}</span>
              </p>
            </div>

            <!-- Divider line -->
            <div class="h-px bg-slate-200 dark:bg-slate-700"></div>

            <!-- Renderer -->
            <div class="flex-1 overflow-y-auto">
              <ChRenderer {ch} {approve} {reject} />
            </div>
          </div>
        {/if}
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

        <div class="flex items-center gap-2">
          <textarea
            bind:value={question}
            onkeydown={handleKeyDown}
            placeholder="Type your message…"
            class="flex-1 resize-none rounded border p-2 bg-background text-sm leading-snug
                   agentRole:outline-none agentRole:ring-1 agentRole:ring-accent rounded-lg"
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
  </main>
</div>