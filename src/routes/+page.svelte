<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import GraphView from "$lib/components/GraphView.svelte";
  import Editor from "$lib/components/Editor.svelte";
  import LlmChat from "$lib/components/LLMChat.svelte";

  import { useOnSelectionChange } from '@xyflow/svelte';

  import { graphCode } from "$lib/state/graph.svelte.ts";

  useOnSelectionChange(({ nodes, edges }) => {
    graphCode.setSelectedNodesEdges(nodes, edges);
  });
</script>

<Resizable.PaneGroup direction="horizontal">
  <Resizable.Pane defaultSize={30}><Editor></Editor></Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane><GraphView /></Resizable.Pane>
  <!-- <Resizable.Handle withHandle /> -->

  <!-- <Resizable.Pane><LlmChat /></Resizable.Pane> -->
</Resizable.PaneGroup>
