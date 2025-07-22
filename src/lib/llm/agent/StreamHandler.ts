import { StreamParamExtractor } from './StreamParamExtractor'; // wherever it lives
import type { ChatHistory } from './ChatHistory';
import { graphCode } from '$lib/state/graph.svelte';
import { editorState, proposeCurrSrc, proposePlan } from '$lib/state/editor.svelte';
import type { LLMStream } from './LLMClient';

/* UIUpdater.types.ts (or wherever you keep shared types) */
export type StreamDeltaFn   = (delta: string) => void;
export type ShowToolFn      = (payload: {
  id: string;
  tool?: any;
  delta?: string;
  approvalId?: string;
}) => void;
export type StopGeneratingFn  = () => void;

export interface UIUpdaterCallbacks {
  streamDelta:    StreamDeltaFn;
  showTool:       ShowToolFn;
  stopGenerating: StopGeneratingFn;
}

type Call = {name: string, args: any};

export interface ApprovalGateway {
  ask(message: Call): Promise<string | null>;
}

export class StreamHandler implements ApprovalGateway {
  constructor(private history: ChatHistory, private callbacks: UIUpdaterCallbacks) {}

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

    const pathExtractor = new StreamParamExtractor('path', 'write_project_file');

    let buffer = "";

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
          buffer += ev.delta;
          // console.log(ev.delta);
          const extractor = activeToolCalls.get(ev.id)!;
          extractor.feed(ev.delta);
          pathExtractor.feed(ev.delta);

          switch (extractor.getToolName()) {
            case 'write_plan_md_file':
              proposePlan(extractor.getBuffer());
              break;

            case 'write_graph_yaml_file':
              graphCode.proposeGraph(extractor.getBuffer());
              break;

            case 'write_project_file':
              // console.log(extractor.getBuffer());
              // console.log(pathExtractor.getBuffer());
              editorState.currSrcPath = pathExtractor.getBuffer();
              proposeCurrSrc(extractor.getBuffer());
              break;

            default:
              this.callbacks.showTool({ id: ev.id, delta: ev.delta });
          }
          break;
        }

        case 'toolCallEnd': {
          console.log(ev.raw);
          this.history.appendTool(ev.raw.item);
          const extractor = activeToolCalls.get(ev.id)!;
          toolCalls.push({
            id: ev.id,
            call_id: ev.raw.item.call_id,
            name: extractor.getToolName(),
            args: JSON.parse(ev.raw.item.arguments),
          });
          activeToolCalls.delete(ev.id);
          break;
        }
      }
    }

    // console.log(buffer);
    return { assistantContent, toolCalls };
  }
}