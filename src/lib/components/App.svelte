<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  
  import ChatShell from "./app/LLMChat/ChatShell.svelte";
  import Editors from "./app/Editor/Editors.svelte";

  import { currAgentAndChatState } from '$lib/state/allAgents.svelte';
  import { onMount } from "svelte";
  
  import { checkForAppUpdates } from "$lib/util/updater";
  import { useOnSelectionChange } from "@xyflow/svelte";
  import { graphCode } from "$lib/state/graph.svelte";

  let agentAndChatState = $derived(currAgentAndChatState.current); 

  onMount(() => {
    checkForAppUpdates();
  })

  // useOnSelectionChange(({ nodes, edges }) => {
  //   graphCode.setSelectedNodesEdges(nodes, edges);
  // });
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="canvasAISplit">
  <Resizable.Pane >
    <Editors />
  </Resizable.Pane>
  <Resizable.Handle withHandle />

  <!-- 3. Right pane -->
  <Resizable.Pane defaultSize={35}>
     <ChatShell bind:agentAndChatState/>
  </Resizable.Pane>
</Resizable.PaneGroup>
