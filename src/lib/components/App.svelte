<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import GraphView from "$lib/components/app/GraphView.svelte";
  import Editor from "$lib/components/app/Editor.svelte";
  import LlmChat from "$lib/components/app/LLMChat.svelte";

  import { useOnSelectionChange } from '@xyflow/svelte';

  import { graphCode } from "$lib/state/graph.svelte";
  
  import { focus } from "$lib/state/focus.svelte";

  import Terminal from "$lib/components/app/Terminal.svelte";
  import SettingsDialog from "$lib/components/settings/SettingsDialog.svelte";

  useOnSelectionChange(({ nodes, edges }) => {
    graphCode.setSelectedNodesEdges(nodes, edges);

    if (nodes.length && focus.node !== nodes[0].id) {
      focus.node = nodes[0].id;   // update only when different
    } else if (nodes.length === 0 && focus.node !== "All") {
        focus.node = "All";
    }
  });

  let twoPane = $derived(focus.agentMode === "plan");
</script>

<Resizable.PaneGroup direction="horizontal">
  <!-- 1. Left pane -->
  <Resizable.Pane order={1} defaultSize={twoPane ? 55 : 30}>
    <div class="h-full flex flex-col overflow-hidden">
        <!-- editor takes all remaining space -->
        <div class="flex-1 overflow-hidden">
        <Editor />
        </div>

        <!-- button row: fixed height, no extra margin that would blow up the pane -->
        <div class="shrink-0 flex items-center justify-start p-2">
            <SettingsDialog />
        </div>
    </div>
  </Resizable.Pane>
  <Resizable.Handle withHandle />

  <!-- 2. Middle pane – only when focusMode === "code" -->
  {#if !twoPane}
    <Resizable.Pane order={2} defaultSize={40}>
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane order={1} defaultSize={85}>
          <GraphView />
        </Resizable.Pane>

        {#if focus.agentMode === "code"}
            <Resizable.Handle withHandle />
            <Resizable.Pane order={2} defaultSize={15}>
            <Terminal />
            </Resizable.Pane>
        {/if}
      </Resizable.PaneGroup>
    </Resizable.Pane>
    <Resizable.Handle withHandle />
  {/if}

  <!-- 3. Right pane -->
  <Resizable.Pane order={3} defaultSize={twoPane ? 45 : 30}>
    <LlmChat />
  </Resizable.Pane>
</Resizable.PaneGroup>
