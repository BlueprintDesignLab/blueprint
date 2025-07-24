import type { Node, Edge } from "@xyflow/svelte";
import { yamlViewToGraph, type MergedGraph } from "./graphIO";

export type DiffRecord = {
  added: string[];
  modified: string[];
  destroyed: string[];
};

export type BlueprintDiff = {
  nodes: DiffRecord;
  edges: DiffRecord;
};

// ---------- new helpers ----------
export type PreviewGraph = {
  nodes: Node[];
  edges: Edge[];
  // map original id -> status
  status: Map<string, 'added' | 'destroyed' | 'modified' | 'unchanged'>;
};

/**
 * Deep-equality helper (works for plain JSON-compatible data).
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }

  if (a instanceof Object && b instanceof Object) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return (
      keysA.length === keysB.length &&
      keysA.every(k => keysB.includes(k) && deepEqual((a as any)[k], (b as any)[k]))
    );
  }

  return false;
}

type NodePayload = Node['data']; // whatever the semantic part is
type EdgePayload = Edge['data'];

/* ---- helpers ---------------------------------------------------------- */
function payloadOf<T extends Node | Edge>(obj: T): T extends Node ? NodePayload : EdgePayload {
  return obj.data as any;
}

function nodeWithPayload(base: Node, payload: NodePayload): Node {
  return { ...base, data: payload };
}

function edgeWithPayload(base: Edge, payload: EdgePayload): Edge {
  return { ...base, data: payload };
}

export function buildPreview(
  liveGraph: MergedGraph,
  proposedSem: string
): PreviewGraph {
  const proposed = yamlViewToGraph(proposedSem, ''); // may throw

  const liveNodes = new Map(liveGraph.nodes.map(n => [n.id, n]));
  const liveEdges = new Map(liveGraph.edges.map(e => [e.id, e]));

  const status = new Map<string, 'added' | 'destroyed' | 'modified' | 'unchanged'>();
  const previewNodes: Node[] = [];
  const previewEdges: Edge[] = [];

  /* --- nodes --- */
  for (const proposedNode of proposed.nodes) {
    const live = liveNodes.get(proposedNode.id);

    if (!live) {
      // brand-new → use proposed as-is
      status.set(proposedNode.id, 'added');
      previewNodes.push(proposedNode);
    } else if (!deepEqual(payloadOf(live), payloadOf(proposedNode))) {
      // semantic change → keep live meta, replace data
      status.set(proposedNode.id, 'modified');
      previewNodes.push(nodeWithPayload(live, payloadOf(proposedNode)));
    } else {
      // identical payload → keep live object untouched
      status.set(proposedNode.id, 'unchanged');
      previewNodes.push(live);
    }
  }

  for (const [id, liveNode] of liveNodes) {
    if (!proposed.nodes.find(p => p.id === id)) {
      status.set(id, 'destroyed');
      previewNodes.push(liveNode); // still render it
    }
  }

  /* --- edges (same pattern) --- */
  for (const proposedEdge of proposed.edges) {
    const live = liveEdges.get(proposedEdge.id);

    if (!live) {
      status.set(proposedEdge.id, 'added');
      previewEdges.push(proposedEdge);
    } else if (!deepEqual(payloadOf(live), payloadOf(proposedEdge))) {
      status.set(proposedEdge.id, 'modified');
      previewEdges.push(edgeWithPayload(live, payloadOf(proposedEdge)));
    } else {
      status.set(proposedEdge.id, 'unchanged');
      previewEdges.push(live);
    }
  }

  for (const [id, liveEdge] of liveEdges) {
    if (!proposed.edges.find(p => p.id === id)) {
      status.set(id, 'destroyed');
      previewEdges.push(liveEdge);
    }
  }

  return { nodes: previewNodes, edges: previewEdges, status };
}