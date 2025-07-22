import { loadGraph, type MergedGraph } from "$lib/util/graphIO";

import { type Node, type Edge } from "@xyflow/svelte";


type PartialGraph = {
  nodes?: Node[];
  edges?: Edge[];
};


class GraphCode {
  nodes = $state.raw<Node[]>([]);
  edges = $state.raw<Edge[]>([]);

  selectedNodes:Node[] = $state.raw([]);
  selectedEdges:Edge[] = $state.raw([]);

  proposedNodes:Node[] = $state.raw([]);
  proposedEdges:Edge[] = $state.raw([]);

  filtering = $derived(this.selectedNodes.length > 0 || this.selectedEdges.length);

  loadGraph = (semDerived: string, viewDerived: string) => {
    const newMerged = loadGraph(semDerived, viewDerived);
    
    if (this.filtering) {
      this.overwritePartial(newMerged);
    } else {
      this.nodes = newMerged.nodes;
      this.edges = newMerged.edges;
    }
  }

  /** load external data into the *proposed* buffers */
  proposeGraph = (newSem: string) => {
    let proposedGraph: MergedGraph = {nodes: [], edges: []};

    try {
      proposedGraph = loadGraph(newSem, "");
    } catch (e) {
      return;
    }

    this.proposedNodes = proposedGraph.nodes;
    this.proposedEdges = proposedGraph.edges;
  };

  /** move proposed → live, then wipe proposed */
  commitGraph = () => {
    this.nodes = this.proposedNodes;
    this.edges = this.proposedEdges;
    this.clearProposed();
  };

  /** discard proposed changes */
  clearProposed = () => {
    this.proposedNodes = [];
    this.proposedEdges = [];
  };

  getGraph = () => {
    return {nodes: this.nodes, edges: this.edges};
  }

  setSelectedNodesEdges = (newSelectedNodes: Node[], newSelectedEdges: Edge[]) => {
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

  overwritePartial = (
    patch: PartialGraph,
    opts: { pruneMissing?: boolean } = {}
  ) => {
    if (!patch.nodes && !patch.edges) return; // nothing to do

    if (this.selectedNodes.length === 0) {
      throw new Error(
        "overwritePartial: no nodes are selected – nothing to merge into."
      );
    }

    /* ---------- Helper sets ---------- */
    const selIds = new Set(this.selectedNodes.map((n) => n.id));

    /* ---------- NODES ---------- */
    if (patch.nodes) {
      const nodeMap = new Map(this.nodes.map((n) => [n.id, { ...n }]));

      for (const n of patch.nodes) {
        if (!selIds.has(n.id)) {
          throw new Error(
            `patch node '${n.id}' lies outside the current selection`
          );
        }
        nodeMap.set(n.id, { ...nodeMap.get(n.id), ...n });
      }

      if (opts.pruneMissing) {
        for (const id of [...selIds]) {
          const stillPresent = patch.nodes.some((n) => n.id === id);
          if (!stillPresent) nodeMap.delete(id);
        }
      }

      this.nodes = Array.from(nodeMap.values());
    }

    /* ---------- EDGES ---------- */
    if (patch.edges) {
      const edgeMap = new Map(this.edges.map((e) => [e.id, { ...e }]));

      for (const e of patch.edges) {
        const touchesSel = selIds.has(e.source) || selIds.has(e.target);
        if (!touchesSel) {
          throw new Error(
            `patch edge '${e.id}' does not touch selected nodes – rejecting patch`
          );
        }
        edgeMap.set(e.id, { ...edgeMap.get(e.id), ...e });
      }

      if (opts.pruneMissing) {
        for (const [id, edge] of edgeMap) {
          const inPatch = patch.edges.some((e) => e.id === id);
          const touchesSel = selIds.has(edge.source) || selIds.has(edge.target);
          if (touchesSel && !inPatch) edgeMap.delete(id);
        }
      }

      this.edges = Array.from(edgeMap.values());
    }
  };
}

export const graphCode = new GraphCode();