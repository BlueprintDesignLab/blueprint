<script lang="ts">
  import * as Tabs from "$lib/components/ui/tabs/index.js";

  import ChRenderer from "./CHRenderer.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import SettingsDialog from "$lib/components/settings/SettingsDialog.svelte";

  import { tick } from "svelte";

  import { agentRole, setAgentFocusNode } from "$lib/state/agentRole.svelte";
  import { encoder } from "$lib/state/contextWindow.svelte";

  import { LucideAlignHorizontalDistributeStart, StopCircle } from "lucide-svelte";

  import { useSvelteFlow } from '@xyflow/svelte';
  import { Badge } from "$lib/components/ui/badge";
  import type { AgentAndChatState } from "$lib/state/allAgents.svelte";
  import { invoke } from "@tauri-apps/api/core";

  const { fitView } = useSvelteFlow();

  let { agentAndChatState = $bindable() }: {agentAndChatState: AgentAndChatState} = $props();

  let ch = $derived(agentAndChatState.ch);
  let agent = $derived(agentAndChatState.agent);

  let question = $state("");
  let contextWindowLength = $derived(encoder.encode(JSON.stringify(ch)).length);

  let chDiv: HTMLDivElement | null = $state(null);

  $effect(() => {
    agentAndChatState.chDiv = chDiv;
  })

  const sendWrapper = () => {
    if (!agentAndChatState.send(question)) return;
    question = "";
    tick().then(() => autoResize(textarea));
  };


  async function approve(chItem: any) {
    const hash = await invoke('ai_checkpoint');
    // // console.log('Checkpoint created:', hash);
    
    agent.handleApproval(chItem.approvalId!, "approve");
    // console.log(chItem);

    chItem.checkpoint = hash;
    chItem.tool.status = "approved";

    delete chItem.approvalId;

    requestAnimationFrame(() => {
      fitView();
    })
  }

  function reject(chItem: any) {
    agent.handleApproval(chItem.approvalId!, null);
    chItem.tool.status = "rejected";
    delete chItem.approvalId;
  }

  let textarea: HTMLTextAreaElement | null = $state(null);

  async function autoResize(el: HTMLTextAreaElement | null) {
    if (!el) return;

    await tick();                   // wait for Svelte to flush
    await new Promise(r => requestAnimationFrame(r)); // wait for browser layout

    el.style.height = "auto";       // collapse to natural height
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (event.shiftKey) {
        // allow newline
        question += "\n";
        autoResize(textarea);
      } else {
        sendWrapper();
      }
    }
  }

  async function yolo() {
    // const hash = await invoke('ai_checkpoint');
    // // console.log('Checkpoint created:', hash);
    question = "Just use your best judgement";
    sendWrapper();
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
      class="shrink-0 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-between"
    >
      <p class="text-sm font-medium text-slate-700 dark:text-slate-200 animate-pulse">
        Coding: <span class="font-mono">{agentRole.node}</span>
      </p>

      {#if agentRole.node !== "All Edges"}
        <Button onclick={() => setAgentFocusNode("All Edges")}>
          Back
        </Button>
      {/if}
    </div>

    <div class="h-px bg-slate-200 dark:bg-slate-700"></div>
  {/if}

  <!-- takes all remaining height -->
  <main class="flex flex-col flex-1 overflow-hidden">
    <div class="flex flex-col flex-1 min-h-0 mx-auto w-full p-4">
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
              
              <Button variant="destructive" class="bg-red-400" onclick={() => agentAndChatState.clear()}>
                Clear
              </Button>
             
            </div>

            <!-- Right side buttons (sendWrapper, etc.) -->
            <div class="flex items-center gap-2">
              <Button class="sm" variant="secondary" onclick={yolo}>
                YOLO
              </Button>

              {#if agentAndChatState.generating}
                <Button onclick={() => agentAndChatState.stopGenerating()} size="sm">
                  <StopCircle class="h-4 w-4" />
                </Button>
              {:else}
                <Button onclick={sendWrapper} size="sm">
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