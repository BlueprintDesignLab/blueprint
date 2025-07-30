import { parse, stringify } from "yaml";
import { type Node, type Edge, MarkerType, type EdgeMarkerType, Position } from "@xyflow/svelte";

import dagre from "@dagrejs/dagre";
import { invoke } from "@tauri-apps/api/core";
import { debounce } from "./debounce";

type NodeSem = Record<string, unknown>;
type EdgeSem = Record<string, unknown>;

/* ---------- semantic container as in YAML ---------- */
export interface GraphSemYAML {
  nodes: Record<string, unknown>;
  edges: Record<string, unknown>;
}

export type NodeView = Omit<Node, "data">;
export type EdgeView = Omit<Edge, "data">;

export interface GraphViewJSON {
  nodes: NodeView[];
  edges: EdgeView[];
}

export interface MergedGraph {
  nodes: Node[];
  edges: Edge[];
}

export const DEFAULT_MARKEREND: EdgeMarkerType = {
  type: MarkerType.Arrow,
  width: 20,
  height: 20,
  strokeWidth: 1,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 150;
const nodeHeight = 40;

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = "TB") {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 120,
    ranksep: 200,
    edgesep: 20,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.width ?? nodeWidth,
      height: node.height ?? nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/* ───────────────────── Loader ───────────────────────── */
export function yamlViewToGraph(yamlText: string, viewText: string): MergedGraph {
  if (yamlText === "") {
    yamlText = "nodes: []\nedges: []\n";
  }

  if (viewText.trim() === "") {
    viewText = '{"nodes":[], "edges":[]}';
  }

  const sem = parse(yamlText) as GraphSemYAML;

  const view = (
    viewText ? JSON.parse(viewText) : { nodes: [], edges: [] }
  ) as Partial<GraphViewJSON>;

  let missingV = 0;

  const nodes: Node[] = Object.entries(sem.nodes ?? {}).map(([id, semNode]) => {
    const v = view.nodes?.find((n) => n.id === id);

    if (!v) {
      missingV += 1;
    }

    const combNode: Node = {
      id,
      type: "bpNode",
      data: { ...(semNode as NodeSem) },
      position: v?.position ?? { x: 40, y: 40 },
      width: v?.width ?? 150,
      height: v?.height ?? 40,
      zIndex: v?.zIndex ?? 0,
    }

    return combNode;
  }) ?? [];

  const edges: Edge[] = Object.entries(sem.edges ?? {}).map(([id, semEdge]) => {
    const v = view.edges?.find((e) => e.id === id);
    const { source, target } = semEdge as EdgeSem;
    return {
      id,
      type: "bpEdge",
      source,
      target,
      sourceHandle: v?.sourceHandle ?? 'a',
      targetHandle: v?.targetHandle ?? 'b',
      data: { ...(semEdge as EdgeSem) },
      zIndex: v?.zIndex ?? 1,
      markerEnd: v?.markerEnd ?? DEFAULT_MARKEREND,
      animated: true,
    } as Edge;
  }) ?? [];

  if (missingV > nodes.length * 0.2) {
    return getLayoutedElements(nodes, edges);
  }

  // console.log(nodes);
  // console.log(edges);

  return { nodes, edges };
}

export function saveGraphView(merged: MergedGraph): string {
  /* ---------- view JSON ---------- */
  const viewOut: GraphViewJSON = {
    nodes: merged.nodes.map(
      ({ id, type, position, width, height, zIndex }): NodeView => ({
        id,
        position,
        type: type ?? "bpNode",
        width: width ?? 150,
        height: height ?? 40,
        zIndex: zIndex ?? 0,
      })
    ),

    edges: merged.edges.map(
      ({ id, source, target, zIndex, markerEnd }): EdgeView => ({
        id,
        source,
        target,
        zIndex: zIndex ?? 1,
        markerEnd: markerEnd,
      })
    ),
  };

  const viewStr = JSON.stringify(viewOut, null, 2);

  return viewStr;
}

export function saveGraphSemantic(merged: MergedGraph): string {
  // console.log(merged);
  const outNodes: GraphSemYAML["nodes"] = {};
  const outEdges: GraphSemYAML["edges"] = {};

  /** NODES */
  merged.nodes.forEach((n) => {
    const nParent = n.parentId;
    const { id, data: semNode } = n;
    const { id: _, ...props } = semNode as NodeSem;
    outNodes[id] = {...props, parent: nParent};
  });

  /** EDGES */
  merged.edges.forEach((e) => {
    const { id, source, target, data: semEdge } = e;
    // YAML wants source/target plus semantic props
    outEdges[id] = {
      source,
      target,
      ...(semEdge as EdgeSem),
    };
  });

  const yamlStr = stringify({ nodes: outNodes, edges: outEdges }, {
    // force every string to be quoted
    defaultStringType: 'QUOTE_DOUBLE',
    lineWidth: 0
  });

  return yamlStr;
}

export const loadGraphFiles = async () => {
  const [yaml, view] = await Promise.allSettled([
    invoke<string>('read_file', { path: '.blueprint/graph.yaml' }).catch(() => ''),
    invoke<string>('read_file', { path: '.blueprint/view.json' }).catch(() => ''),
  ]);
  return { yaml: yaml.status === 'fulfilled' ? yaml.value : '', 
           view:  view.status  === 'fulfilled' ? view.value  : '' };
};


const graphYamlDebounced = debounce((src: string) => {
  // const src = saveGraphSemantic(graph);
  invoke('write_project_file', { path: './.blueprint/graph.yaml', content: src })
}, 100);

const viewJsonDebounced  = debounce((src: string) => {
  // const src = saveGraphView(graph);
  invoke('write_project_file', { path: './.blueprint/view.json', content: src })
}, 100);

export const saveGraphYaml = graphYamlDebounced;
export const saveViewJson  = viewJsonDebounced;

type PartialGraph = {
  nodes?: Node[];
  edges?: Edge[];
};
