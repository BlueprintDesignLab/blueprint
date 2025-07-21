import { StreamParamExtractor } from './StreamParamExtractor'; // wherever it lives
import { graphCode } from '$lib/state/graph.svelte';

/* UIUpdater.types.ts (or wherever you keep shared types) */
export type StreamDeltaFn   = (delta: string) => void;
export type ShowToolFn      = (payload: {
  id: string;
  tool?: any;
  delta?: string;
  approvalId?: string;
}) => void;

export type StopGeneratingFn  = () => void;
export type UpdateModeFn      = (mode: AgentRoles) => void;
export type UpdateNodeFn      = (node: string) => void;
export type UpdatePlanFn      = (plan: string) => void;
export type UpdateGraphFn     = (graph: string) => void;
export type UpdateSrcFn       = (src: string) => void;

export interface UIUpdaterCallbacks {
  streamDelta:    StreamDeltaFn;
  showTool:       ShowToolFn;
  stopGenerating: StopGeneratingFn;
  updateMode:     UpdateModeFn;
  updateNode:     UpdateNodeFn;
  updatePlan:     UpdatePlanFn;
  updateGraph:    UpdateGraphFn;
  updateCurrSrc:  UpdateSrcFn;
}

type Call = {name: string, args: any};

export interface ApprovalGateway {
  ask(message: Call): Promise<string | null>;
}

export class UIUpdater implements ApprovalGateway {
  constructor(private callbacks: UIUpdaterCallbacks) {}

  /* ---------- ApprovalGateway implementation ---------- */
  private pendings = new Map<string, { resolve: (v: string | null) => void; reject: (e: Error) => void }>();

  ask(message: Call): Promise<string | null> {
    console.log(message);
    const id = crypto.randomUUID();
    return new Promise<string | null>((resolve, reject) => {
      this.pendings.set(id, { resolve, reject });
      this.callbacks.showTool({ id: crypto.randomUUID(), tool: message, approvalId: id });
    });
  }

  handleApproval(id: string, result: string | null) {
    const p = this.pendings.get(id);
    if (!p) return;
    p.resolve(result);
    this.pendings.delete(id);
  }

  showToolCalling(tc: any) {
    // this.updateUI(`\n> Task Completed!`);
    const callingObj = {
      type: "function_call_output",
      call_id: tc.call_id,
      arguments: tc.args,
      status: "calling",
      name: tc.name,
      timestamp: new Date().toISOString()
    };

    this.callbacks.showTool({id: tc.id, tool: callingObj});
  }

  showToolCallResult(tc: any, output: string) {
    // this.updateUI(`\n> Task Completed!`);
    const resObj = {
      type: "function_call_output",
      call_id: tc.call_id,
      output: output,
      status: "resolved",
      name: tc.name,
      timestamp: new Date().toISOString()
    };

    this.callbacks.showTool({id: tc.id, tool: resObj});
  }

  stop() {
    this.callbacks.stopGenerating();
  }

  async consume(stream: LLMStream) {
    let assistantContent = '';
    const toolCalls: any[] = [];

    // Track active tool calls via StreamParamExtractor
    const activeToolCalls = new Map<string, StreamParamExtractor>();

    for await (const ev of stream.events()) {
      switch (ev.type) {
        case 'text':
          assistantContent += ev.delta;
          this.callbacks.streamDelta(ev.delta);
          break;

        case 'toolCallStart': {
          this.callbacks.showTool({ id: ev.id, tool: { name: ev.name, arguments: "", status: "in_progress" } });
          activeToolCalls.set(ev.id, new StreamParamExtractor('content', ev.name));
          break;
        }

        case 'toolCallArgs': {
          const extractor = activeToolCalls.get(ev.id)!;
          extractor.feed(ev.delta);

          switch (extractor.getToolName()) {
            case 'write_plan_md_file':
              this.callbacks.updatePlan(extractor.getBuffer());
              break;
            case 'write_graph_yaml_file':
              try {
                graphCode.loadGraph(extractor.getBuffer(), '');
              } catch {}
              break;
            case 'write_project_file':
              this.callbacks.updateCurrSrc(extractor.getBuffer());
              break;
            default:
              this.callbacks.showTool({ id: ev.id, delta: ev.delta });
          }
          break;
        }

        case 'toolCallEnd': {
          const extractor = activeToolCalls.get(ev.id)!;
          toolCalls.push({
            id: ev.id,
            name: extractor.getToolName(),
            args: JSON.parse(extractor.getBuffer()),
          });
          activeToolCalls.delete(ev.id);
          break;
        }
      }
    }

    return { assistantContent, toolCalls };
  }
}