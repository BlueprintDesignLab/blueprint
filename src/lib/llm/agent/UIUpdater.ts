import { graphCode } from "$lib/state/graph.svelte";

export type StreamDeltaFn   = (delta: string) => void;
export type ShowToolFn      = (payload: { id: string; tool?: any; delta?: string; approvalId?: string }) => void;
export type UpdateModeFn    = (mode: AgentModes) => void;
export type UpdateNodeFn    = (node: string) => void;
export type UpdatePlanFn    = (plan: string) => void;
export type UpdateGraphFn   = (graph: string) => void;
export type UpdateSrcFn     = (src: string) => void;

export class UIUpdater implements ApprovalGateway {
  constructor(
    private callbacks: {
      streamDelta: StreamDeltaFn;
      showTool: ShowToolFn;
      updateMode: UpdateModeFn;
      updateNode: UpdateNodeFn;
      updatePlan: UpdatePlanFn;
      updateGraph: UpdateGraphFn;
      updateCurrSrc: UpdateSrcFn;
    }
  ) {}

  /* ---------- ApprovalGateway implementation ---------- */
  private pendings = new Map<string, { resolve: (v: string | null) => void; reject: (e: Error) => void }>();

  ask(message: any): Promise<string | null> {
    const id = crypto.randomUUID();
    return new Promise<string | null>((resolve, reject) => {
      this.pendings.set(id, { resolve, reject });
      this.callbacks.showTool({ id: crypto.randomUUID(), tool: message, approvalId: id });
    });
  }

  /** Called by the React/Svelte UI when the user clicks Approve/Reject. */
  handleApproval(id: string, result: string | null) {
    const p = this.pendings.get(id);
    if (!p) return;
    p.resolve(result);
    this.pendings.delete(id);
  }

  async consume(stream: LLMStream) {
    let assistantContent = "";
    const toolCalls: any[] = [];
    const buffers = new Map<string, string>(); // accumulate args per tool id

    for await (const ev of stream.events()) {
      switch (ev.type) {
        case "text":
          assistantContent += ev.delta;
          this.callbacks.streamDelta(ev.delta);
          break;

        case "toolCallStart":
          this.callbacks.showTool({ id: ev.id, tool: { name: ev.name } });
          buffers.set(ev.id, "");
          break;

        case "toolCallArgs": {
          const buf = (buffers.get(ev.id) ?? "") + ev.delta;
          buffers.set(ev.id, buf);

          switch (buffers.get(ev.id)?.["toolName"]) { // quick heuristic
            case "write_plan_md_file":
              this.callbacks.updatePlan(buf);
              break;
            case "write_graph_yaml_file":
              try { graphCode.loadGraph(buf, ""); } catch {}
              break;
            case "write_project_file":
              this.callbacks.updateCurrSrc(buf);
              break;
            default:
              this.callbacks.showTool({ id: ev.id, delta: ev.delta });
          }
          break;
        }

        case "toolCallEnd": {
          const args = JSON.parse(ev.args);
          toolCalls.push({ id: ev.id, name: ev.name, arguments: args });
          buffers.delete(ev.id);
          break;
        }
      }
    }

    return { assistantContent, toolCalls };
  }
}