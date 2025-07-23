import type { Node, Edge } from "@xyflow/svelte";
import { parse } from "yaml";
import { loadGraph } from "./graphIO";

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


export function buildPreview(
  currSem: string,
  proposedSem: string
): PreviewGraph {
  const proposed = loadGraph(proposedSem, ''); // may throw → caller should catch
  const liveGraph = loadGraph(currSem, ''); // may throw → caller should catch

  const liveNodes = new Map(liveGraph.nodes.map(n => [n.id, n]));
  const liveEdges = new Map(liveGraph.edges.map(e => [e.id, e]));

  const status = new Map<string, 'added' | 'destroyed' | 'modified' | 'unchanged'>();
  const previewNodes: Node[] = [];
  const previewEdges: Edge[] = [];

  // --- nodes ---
  for (const n of proposed.nodes) {
    if (!liveNodes.has(n.id)) {
      status.set(n.id, 'added');
    } else if (!deepEqual(liveNodes.get(n.id), n)) {
      status.set(n.id, 'modified');
    } else {
      status.set(n.id, 'unchanged');
    }
    previewNodes.push(n);
  }
  for (const [id, n] of liveNodes) {
    if (!proposed.nodes.find(p => p.id === id)) {
      status.set(id, 'destroyed');
      previewNodes.push(n); // keep it so we can render it as red
    }
  }

  // --- edges (same pattern) ---
  for (const e of proposed.edges) {
    if (!liveEdges.has(e.id)) {
      status.set(e.id, 'added');
    } else if (!deepEqual(liveEdges.get(e.id), e)) {
      status.set(e.id, 'modified');
    } else {
      status.set(e.id, 'unchanged');
    }
    previewEdges.push(e);
  }
  for (const [id, e] of liveEdges) {
    if (!proposed.edges.find(p => p.id === id)) {
      status.set(id, 'destroyed');
      previewEdges.push(e);
    }
  }

  return { nodes: previewNodes, edges: previewEdges, status };
}