import { buildPreview, type PreviewGraph } from "$lib/util/graphDiff";

import { saveGraphSemantic, yamlViewToGraph, type MergedGraph } from "$lib/util/graphIO";

import { type Node, type Edge } from "@xyflow/svelte";
import { AgentAndChatState, developerAgentMap } from "./allAgents.svelte";
import { agentRole } from "./agentRole.svelte";


type PartialGraph = {
  nodes?: Node[];
  edges?: Edge[];
};


class GraphCode {
  // nodes = $state.raw<Node[]>([]);
  // edges = $state.raw<Edge[]>([]);

  selectedNodes:Node[] = $state.raw([]);
  selectedEdges:Edge[] = $state.raw([]);

  filtering: boolean = $derived(this.selectedNodes.length > 0 || this.selectedEdges.length > 0);

  previewGraph = $state.raw<PreviewGraph | null>(null); // null == no preview
  previewStr = $state("");

  graphStr = $state("");
  viewStr = $state("");

  nodes = $derived(yamlViewToGraph(this.graphStr, this.viewStr).nodes);
  edges = $derived(yamlViewToGraph(this.graphStr, this.viewStr).edges);

  /* accept the proposal and make it live */
  commitGraph = () => {
    this.graphStr = this.previewStr;
    this.clearProposed();
  };

  /* throw away proposal and preview */
  clearProposed = () => {
    this.previewGraph = null;
    this.previewStr = "";
  };

  setGraph = (semDerived: string, viewDerived: string) => {
    this.graphStr = semDerived;
    this.viewStr = viewDerived;

    const newMerged = yamlViewToGraph(semDerived, viewDerived);

    // create a worker agent for every node
    for (const node of newMerged.nodes) {
      const nodeId = node.id;
      if (!developerAgentMap.has(nodeId)) {
        const store = new AgentAndChatState("code", nodeId);
        developerAgentMap.set(nodeId, store);
      }
    }
  }

  /** load external data into the *proposed* buffers */
  proposeGraph = (newSem: string) => {
    this.previewStr = newSem;
    try {
      this.previewGraph = buildPreview(
        this.getGraph(),
        newSem
      );
    } catch (e) {
      // suppress intermediate state
      // console.error('Invalid proposed YAML', e);
      return;
    }
  };

  getGraph = () => {
    return {nodes: this.nodes, edges: this.edges} as MergedGraph;
  }

  setSelectedNodesEdges = (newSelectedNodes: Node[], newSelectedEdges: Edge[]) => {
    const nodeIds = new Set(newSelectedNodes.map(n => n.id));
    const edgeIds = new Set(newSelectedEdges.map(e => e.id));

    const sameNodes =
      this.selectedNodes.length === newSelectedNodes.length &&
      newSelectedNodes.every(n => this.selectedNodes.find(s => s.id === n.id));
    const sameEdges =
      this.selectedEdges.length === newSelectedEdges.length &&
      newSelectedEdges.every(e => this.selectedEdges.find(s => s.id === e.id));
    if (sameNodes && sameEdges) return;

    this.nodes = this.nodes.map(n =>
      n.selected !== nodeIds.has(n.id) ? { ...n, selected: nodeIds.has(n.id) } : n
    );
    this.edges = this.edges.map(e =>
      e.selected !== edgeIds.has(e.id) ? { ...e, selected: edgeIds.has(e.id) } : e
    );

    this.selectedNodes = newSelectedNodes;
    this.selectedEdges = newSelectedEdges;
  }

  getSelectedGraph = () => {
    if (!this.filtering) {
      return {nodes: this.nodes, edges: this.edges};
    }

    const dispNodes = [...this.selectedNodes];
    const dispEdges = [...this.selectedEdges];

    const selectedNodeIds = new Set(this.selectedNodes.map((n) => n.id));

    if (this.selectedNodes.length > 0) {
      const edgeAdjacentToNodes = this.edges.filter(edge =>
        selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)
      )

      dispEdges.push(...edgeAdjacentToNodes);
    }

    if (this.selectedEdges.length > 0) {
      for (const dispEdge of dispEdges) {
        dispNodes.push(this.nodes.find((n) => dispEdge.source === n.id)!)
        dispNodes.push(this.nodes.find((n) => dispEdge.target === n.id)!)
      }
    }

    return {
      nodes: dispNodes,
      edges: dispEdges
    };
  }

  applyPatch(sem: string) {
    const newGraph = yamlViewToGraph(sem, this.viewStr);

    const editedGraph = this.overwritePartial(newGraph);
    
    if (editedGraph !== null) {
      this.graphStr = saveGraphSemantic(editedGraph);
    }
  }

  overwritePartial = (
    patch: PartialGraph
  ): MergedGraph | null => {
    if (!patch.nodes && !patch.edges) return null; // nothing to do

    let nodes: Node[] = [];
    let edges: Edge[] = [];

    /* ---------- NODES ---------- */
    if (patch.nodes) {
      const nodeMap = new Map(this.nodes.map((n) => [n.id, { ...n }]));

      for (const n of patch.nodes) {
        nodeMap.set(n.id, { ...nodeMap.get(n.id), ...n });
      }

      nodes = Array.from(nodeMap.values());
    }

    /* ---------- EDGES ---------- */
    if (patch.edges) {
      const edgeMap = new Map(this.edges.map((e) => [e.id, { ...e }]));

      for (const e of patch.edges) {
        edgeMap.set(e.id, { ...edgeMap.get(e.id), ...e });
      }

      edges = Array.from(edgeMap.values());
    }

    return {nodes, edges};
  };
}

export const graphCode = new GraphCode();