<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import ChRenderer from "./CHRenderer.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import SettingsDialog from "$lib/components/settings/SettingsDialog.svelte";

  import { tick } from "svelte";
  import { toast } from "svelte-sonner";

  import { agentRole } from "$lib/state/agentRole.svelte";
  import { encoder } from "$lib/state/contextWindow.svelte";
  import type { ChatState } from "$lib/state/allAgents.svelte";

  import { StopCircle } from "lucide-svelte";

  import { useSvelteFlow } from '@xyflow/svelte';
  import { Badge } from "$lib/components/ui/badge";

  const { fitView } = useSvelteFlow();

  let { ch, generating = $bindable(), agent }: ChatState = $props();

  let chDiv: HTMLDivElement | null = $state(null);

  let question = $state("");
  let contextWindowLength = $derived(encoder.encode(JSON.stringify(ch)).length);

  $effect(() => {
    console.log("scroll?");
    ch.length;
    ch.at(-1)?.content;
    ch.at(-1)?.tool?.args;
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
    const TOLERANCE = 150;
    const autoscroll =
      (chDiv.offsetHeight + chDiv.scrollTop) > (chDiv.scrollHeight - TOLERANCE);
    if (autoscroll) scroll();
  }

  function streamDelta(delta: string) {
    if (ch.at(-1)?.role !== 'assistant') {
      ch.push({ role: 'assistant', content: '' });
    }
    ch.at(-1)!.content += delta;
  }

  const send = () => {
    if (generating) stopGenerating();
    if (question.trim() === "") return;

    const userMessage = { role: "user", content: $state.snapshot(question) };
    ch.push(userMessage);

    // chAssistant();
    generating.current = true;
    (async () => {
      try {
        await agent.run(question);
      } catch (e) {
        toast.error(String(e));
        streamDelta(String(e));
        throw e;
      }
    })();

    question = "";
    tick().then(() => autoResize(textarea));
  };

  function stopGenerating() {
    agent.abort();
    generating.current = false;
  }

  function approve(id: string) {
    agent.handleApproval(id, "approve");

    requestAnimationFrame(() => {
      fitView();
    })
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
        question += "\n";
        autoResize(textarea);
      } else {
        send();
      }
    }
  }
</script>

<div class="flex flex-col h-screen">
  <!-- fixed-height header -->
  <header
  class="flex items-center gap-4 px-4 py-2 border-b border-slate-200 dark:border-slate-700 shrink-0"
  >
    <span class="text-xs font-medium text-foreground">
        Role: {agentRole.agentRole}
        <span class="mx-2 text-muted-foreground">·</span>
        Context: {contextWindowLength}
        <span class="mx-2 text-muted-foreground">·</span>
        <br/>
        <span class="text-xs text-muted-foreground">Each agent has its own memory</span>
    </span>

    <div class="ml-auto">
        <SettingsDialog />
    </div>
  </header>

  {#if agentRole.agentRole === "code"}
    <div
      class="shrink-0 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
    >
      <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
        Coding: <span class="font-mono">{agentRole.node}</span>
      </p>
    </div>
    <div class="h-px bg-slate-200 dark:bg-slate-700"></div>
  {/if}

  <!-- takes all remaining height -->
  <main class="flex flex-col flex-1 overflow-hidden">
    <div class="flex flex-col flex-1 min-h-0 mx-auto max-w-2xl w-full p-4">
      <div
        bind:this={chDiv}
        class="flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-6 py-5"
      >
        <div class="flex-1 overflow-y-auto">
          <ChRenderer {ch} {approve} {reject} />
        </div>
      </div>
      
      <!-- Tabs + Input -->
      <div class="mt-4 shrink-0">
        <Tabs.Root bind:value={agentRole.agentRole}>
          <Tabs.List
            class="w-full flex items-center gap-2 flex-nowrap border-b border-slate-200 dark:border-slate-700 mb-2"
          >
            <Tabs.Trigger value="plan">Plan</Tabs.Trigger>
            <Tabs.Trigger value="architect">Architect</Tabs.Trigger>
            <Tabs.Trigger value="code">
              Develop
              <Badge variant="outline" class="text-xs px-1 py-0">α</Badge>
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        <div class="flex flex-col gap-2">
          <!-- Textarea for typing messages -->
          <textarea
            bind:value={question}
            onkeydown={handleKeyDown}
            placeholder="Type your message…"
            class="w-full resize-none rounded border p-2 bg-background text-sm leading-snug focus:outline-none focus:ring-1 focus:ring-accent agentRole:outline-none agentRole:ring-1 agentRole:ring-accent rounded-lg"
            rows="1"
            oninput={() => autoResize(textarea)}
            bind:this={textarea}
          ></textarea>

          <!-- Toolbar row below textarea -->
          <div class="flex items-center justify-between">
            <!-- Left side buttons (formatting, attachments, etc.) -->
            <div class="flex items-center gap-1">
              <!-- Example formatting buttons - add your own icons -->
              
              <!-- <button class="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700">
                IDK
              </button> -->
             
            </div>

            <!-- Right side buttons (send, etc.) -->
            <div class="flex items-center gap-2">
              <Button class="sm" variant="secondary">
                IDK
              </Button>

              {#if generating.current}
                <Button onclick={stopGenerating} size="sm">
                  <StopCircle class="h-4 w-4" />
                </Button>
              {:else}
                <Button onclick={send} size="sm">
                  Send
                </Button>
              {/if}
            </div>
          </div>
        </div>      
      </div>
    </div>
  </main>
</div>