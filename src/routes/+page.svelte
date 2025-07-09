<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import GraphView from "$lib/components/GraphView.svelte";
  import Editor from "$lib/components/Editor.svelte";
  import LlmChat from "$lib/components/LLMChat.svelte";

  import { useOnSelectionChange } from '@xyflow/svelte';

  import { graphCode } from "$lib/state/graph.svelte";
  
  import { focus } from "$lib/state/focus.svelte";

  useOnSelectionChange(({ nodes, edges }) => {
    // if (nodes.length > 0) {
    //   focus.node = nodes[0].id;
    // }

    graphCode.setSelectedNodesEdges(nodes, edges);
  });

  // function test() {
  //   invoke("freezeTest", {});
  // }
</script>

<!-- <Button onclick={test}>Freeze</Button> -->
<Resizable.PaneGroup direction="horizontal">
  <Resizable.Pane defaultSize={30}><Editor></Editor></Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane><GraphView /></Resizable.Pane>
  <Resizable.Handle withHandle />
  <Resizable.Pane><LlmChat /></Resizable.Pane>
</Resizable.PaneGroup>
