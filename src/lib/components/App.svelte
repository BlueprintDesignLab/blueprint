<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import PlanEditor from "./app/Editor/PlanEditor.svelte";
  import DevelopEditor from "./app/Editor/DevelopEditor.svelte";
  import ArchitectEditor from "$lib/components/app/Editor/ArchitectEditor.svelte";

  import LlmChat from "$lib/components/app/LLMChat/LLMChat.svelte";

  import { useOnSelectionChange } from '@xyflow/svelte';

  import { graphCode } from "$lib/state/graph.svelte";
  
  import { focus } from "$lib/state/focus.svelte";

  useOnSelectionChange(({ nodes, edges }) => {
    graphCode.setSelectedNodesEdges(nodes, edges);

    if (nodes.length && focus.node !== nodes[0].id) {
      focus.node = nodes[0].id;   // update only when different
    } else if (nodes.length === 0 && focus.node !== "All") {
        focus.node = "All";
    }
  });
  
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="canvasAISplit">
  <Resizable.Pane >
    {#if focus.agentRole === "plan"}
      <PlanEditor />
    {:else if focus.agentRole === "architect"}
      <ArchitectEditor />
    {:else if focus.agentRole === "code"}
      <DevelopEditor />
    {/if}
  </Resizable.Pane>
  <Resizable.Handle withHandle />

  

  <!-- <Resizable.Pane order={1} defaultSize={twoPane ? 70 : 30}>
    <div class="h-full flex flex-col overflow-hidden">
        <div class="flex-1 overflow-hidden">
        <Editor />
        </div>

        <div class="shrink-0 flex items-center justify-start p-2">
        </div>
    </div>
  </Resizable.Pane>
  <Resizable.Handle withHandle />

  {#if !twoPane}
    <Resizable.Pane order={2} defaultSize={40}>
      <Resizable.PaneGroup direction="vertical">
        <Resizable.Pane order={1} defaultSize={85}>
          
          <ArchitectEditor />

        </Resizable.Pane>

        {#if focus.agentRole === "code"}
            <Resizable.Handle withHandle />
            <Resizable.Pane order={2} defaultSize={15}>
            <Terminal />
            </Resizable.Pane>
        {/if}
      </Resizable.PaneGroup>
    </Resizable.Pane>
    <Resizable.Handle withHandle />
  {/if} -->

  <!-- 3. Right pane -->
  <Resizable.Pane defaultSize={35}>
    <LlmChat />
  </Resizable.Pane>
</Resizable.PaneGroup>
