<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  
  import ChatShell from "./app/LLMChat/ChatShell.svelte";
  import Editors from "./app/Editor/Editors.svelte";

  import { AgentAndChatState, currAgentAndChatState, developerAgentMap } from '$lib/state/allAgents.svelte';
  import { agentRole } from "$lib/state/agentRole.svelte";

  // $effect(() => {
  //   if (!developerAgentMap.has(agentRole.node)) {
  //     const store = new AgentAndChatState("code", agentRole.node);
  //     developerAgentMap.set(agentRole.node, store);
  //   }
  // });

  let agentAndChatState = $derived(currAgentAndChatState.current); 
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="canvasAISplit">
  <Resizable.Pane >
    <Editors />
  </Resizable.Pane>
  <Resizable.Handle withHandle />

  <!-- 3. Right pane -->
  <Resizable.Pane defaultSize={35}>
    <!-- <LlmChat /> -->
     <ChatShell bind:agentAndChatState/>
  </Resizable.Pane>
</Resizable.PaneGroup>
