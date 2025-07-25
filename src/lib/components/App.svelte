<script lang="ts">
  import * as Resizable from "$lib/components/ui/resizable/index.js";

  import { useOnSelectionChange } from '@xyflow/svelte';

  import { graphCode } from "$lib/state/graph.svelte";
  import { agentRole } from "$lib/state/agentRole.svelte";
  
  import ChatShell from "./app/LLMChat/ChatShell.svelte";
  import Editors from "./app/Editor/Editors.svelte";

  import { 
    architectAgent, 
    createDeveloperAgentForNode, 
    edgeCodingAgent, 
    getDeveloperAgentForNode, 
    planAgent 
  } from "$lib/state/allAgents.svelte";

  useOnSelectionChange(({ nodes, edges }) => {
    graphCode.setSelectedNodesEdges(nodes, edges);

    if (agentRole.agentRole === "code") {
      if (nodes.length && agentRole.node !== nodes[0].id) {
        agentRole.node = nodes[0].id;   // update only when different
      } else if (nodes.length === 0 && agentRole.node !== "All Edges") {
        agentRole.node = "All Edges";
        createDeveloperAgentForNode(agentRole.node);
      }
    }
  });

  let agentAndState = $derived.by(() => {
    if (agentRole.agentRole === "plan") {
      return planAgent;
    } else if (agentRole.agentRole === "architect") {
      return architectAgent;
    } else if (agentRole.agentRole === "code" && agentRole.node === "All Edges") {
      return edgeCodingAgent;
    }
    return getDeveloperAgentForNode(agentRole.node);
  })
  
</script>

<Resizable.PaneGroup direction="horizontal" autoSaveId="canvasAISplit">
  <Resizable.Pane >
    <Editors />
  </Resizable.Pane>
  <Resizable.Handle withHandle />

  <!-- 3. Right pane -->
  <Resizable.Pane defaultSize={35}>
    <!-- <LlmChat /> -->
     <ChatShell agent={agentAndState.agent} ch={agentAndState.ch} generating={agentAndState.generating}/>
  </Resizable.Pane>
</Resizable.PaneGroup>
