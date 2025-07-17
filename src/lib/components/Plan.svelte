<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import Editor from "$lib/components/app/Editor.svelte";
  import LlmChat from "$lib/components/app/LLMChat.svelte";

  import { useOnSelectionChange } from '@xyflow/svelte';

  import { graphCode } from "$lib/state/graph.svelte";
  
  import { focus } from "$lib/state/focus.svelte";

  useOnSelectionChange(({ nodes, edges }) => {
    graphCode.setSelectedNodesEdges(nodes, edges);

    if (nodes.length && focus.node !== nodes[0].id) {
      focus.node = nodes[0].id;   // update only when different
    }
  });
</script>

<!-- <Button onclick={test}>Freeze</Button> -->
<Resizable.PaneGroup direction="horizontal">
  <Resizable.Pane defaultSize={30}><Editor></Editor></Resizable.Pane>
  <Resizable.Handle withHandle />

  <Resizable.Pane><LlmChat /></Resizable.Pane>
</Resizable.PaneGroup>

<!-- <Terminal></Terminal> -->
