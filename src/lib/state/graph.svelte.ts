import { buildPreview, type PreviewGraph } from "$lib/util/graphDiff";

import { yamlViewToGraph, type MergedGraph } from "$lib/util/graphIO";

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

  proposedSem = "";

  filtering = $derived(this.selectedNodes.length > 0 || this.selectedEdges.length);

  previewGraph = $state.raw<PreviewGraph | null>(null); // null == no preview

  /* build/clear preview without touching live graph */
  showPreview = () => {
    if (!this.proposedSem) {
      this.previewGraph = null;
      return;
    }
    try {
      this.previewGraph = buildPreview(
        this.getGraph(),
        this.proposedSem
      );
    } catch (e) {
      console.error('Invalid proposed YAML', e);
      this.previewGraph = null;
    }
  };

  /* accept the proposal and make it live */
  commitGraph = () => {
    if (!this.previewGraph) return;
    this.nodes = this.previewGraph.nodes.filter(
      n => !this.previewGraph!.status.get(n.id)?.startsWith('destroyed')
    );
    this.edges = this.previewGraph.edges.filter(
      e => !this.previewGraph!.status.get(e.id)?.startsWith('destroyed')
    );
    this.clearProposed();
    this.previewGraph = null;
  };

  /* throw away proposal and preview */
  clearProposed = () => {
    this.proposedSem = '';
    this.previewGraph = null;
  };

  loadGraph = (semDerived: string, viewDerived: string) => {
    const newMerged = yamlViewToGraph(semDerived, viewDerived);
    
    if (this.filtering) {
      this.overwritePartial(newMerged);
    } else {
      this.nodes = newMerged.nodes;
      this.edges = newMerged.edges;
    }
  }

  /** load external data into the *proposed* buffers */
  proposeGraph = (newSem: string) => {
    this.proposedSem = newSem;
  };

  getGraph = () => {
    return {nodes: this.nodes, edges: this.edges} as MergedGraph;
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
      // console.log("no nodes are selected");
      // return;
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