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
  import { Bolt } from "lucide-svelte";
  import { Button } from "./ui/button";

  useOnSelectionChange(({ nodes, edges }) => {
    graphCode.setSelectedNodesEdges(nodes, edges);

    if (nodes.length && focus.node !== nodes[0].id) {
      focus.node = nodes[0].id;   // update only when different
    }
  });
</script>

<!-- <Button onclick={test}>Freeze</Button> -->
<Resizable.PaneGroup direction="horizontal">
  <Resizable.Pane defaultSize={30}>
    <!-- wrapper that fills the pane and clips overflow -->
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

  <Resizable.Pane>
    <Resizable.PaneGroup direction="vertical">
    <Resizable.Pane>
      <GraphView />
    </Resizable.Pane>
    <Resizable.Handle withHandle />

    <Resizable.Pane defaultSize={15}>
        <Terminal />
    </Resizable.Pane>
    </Resizable.PaneGroup>
  </Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane><LlmChat /></Resizable.Pane>
</Resizable.PaneGroup>

<!-- <Terminal></Terminal> -->
