/* ──────────────── nodes.ts ────────────────────────── */
export interface NodeBase {
  id: string;
  label: string;
  parent?: string;
}

/* Context ─ actor / external / internal system */
export interface ContextNode extends NodeBase {
  type: "context";
  role: "actor" | "externalSystem" | "internalSystem";
}

/* Container ─ services, DBs, queues … */
export interface ContainerNode extends NodeBase {
  type: "container";
  role: "api" | "frontend" | "infra" | string;
}

/* Component */
export interface ComponentNode extends NodeBase {
  type: "component";
  role: "controller" | "service" | "repository" | string;
}

/* Code */
export interface CodeNode extends NodeBase {
  type: "code";
  role: "class" | "function" | "test" | string;
  tags?: string[];
}

/* Convenient alias used everywhere else */
export type NodeSem = ContextNode | ContainerNode | ComponentNode | CodeNode;

/* ---------- optional helpers ---------- */
export const isContextNode = (n: NodeSem): n is ContextNode =>
  n.type === "context";
export const isContainerNode = (n: NodeSem): n is ContainerNode =>
  n.type === "container";
export const isComponentNode = (n: NodeSem): n is ComponentNode =>
  n.type === "component";
export const isCodeNode = (n: NodeSem): n is CodeNode => n.type === "code";

/* ──────────────── edges.ts ────────────────────────── */
export interface EdgeBase {
  id: string;
  source: string;
  target: string;
}

/* 1 ▸ Interaction (Context layer) */
export interface InteractionEdge extends EdgeBase {
  type: "interaction";
  kind: string; // login, upload, …
  direction: "->" | "<-";
  sync: boolean;
  trustBoundary: "external" | "internal" | string;
  confidentiality: "public" | "internal" | "confidential" | "secret";
  channel: "web" | "mobile" | "sms" | "batch" | string;
  freq: "interactive" | "periodic" | "bulk";
}

/* 2 ▸ Protocol (Container layer) */
export interface ProtocolEdge extends EdgeBase {
  type: "protocol";
  kind: "request" | "stream" | "pub/sub";
  tech: "REST" | "gRPC" | "WebSocket" | "Kafka" | string;
  direction: "->" | "<-";
  sync: boolean;
  auth: string; // anon, userToken, mTLS …
  encryption: "TLS" | "mTLS" | "none";
  endPoint: string; // URI, topic, queue …
  throughput?: string; // "5 req/s"
  timeout?: string; // "3000 ms"
  retries?: number;
  qosTier?: "bronze" | "silver" | "gold" | string;
}

/* 3 ▸ Contract (Component layer) */
export interface ContractEdge extends EdgeBase {
  type: "contract";
  kind: "command" | "query" | "event";
  direction: "->" | "<-";
  sync: boolean;
  schema: string; // SaveDoc, protobuf msg id …
  idempotent: boolean;
  version: string; // v1, v2.3 …
}

/* 4 ▸ Data-flow (Code layer) */
export interface DataFlowEdge extends EdgeBase {
  type: "dataflow";
  kind: "call" | "read" | "transform";
  direction: "->" | "<-";
  sync: boolean;
  datatype: string; // User, string, DocEntity …
  scope: "local" | "module" | "service";
  mutate: boolean;
  returns: string | null;
}

/* Convenient alias */
export type EdgeSem =
  | InteractionEdge
  | ProtocolEdge
  | ContractEdge
  | DataFlowEdge;

/* ---------- helpers ---------- */
export const isInteraction = (e: EdgeSem): e is InteractionEdge =>
  e.type === "interaction";
export const isProtocol = (e: EdgeSem): e is ProtocolEdge =>
  e.type === "protocol";
export const isContract = (e: EdgeSem): e is ContractEdge =>
  e.type === "contract";
export const isDataFlow = (e: EdgeSem): e is DataFlowEdge =>
  e.type === "dataflow";
