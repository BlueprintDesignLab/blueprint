import { StreamParamExtractor } from './StreamParamExtractor'; // wherever it lives

import { graphCode } from '$lib/state/graph.svelte';
import { proposePlan } from '$lib/state/editor.svelte';

import type { LLMStream } from '../BPAgent/LLMClient';


export type StreamDeltaFn   = (delta: string) => void;
export type ShowToolFn      = (payload: {
  id: string;
  tool?: any;
  delta?: string;
  approvalId?: string;
  checkpoint?: string;
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
  constructor(private callbacks: UIUpdaterCallbacks) {}

  /* ---------- ApprovalGateway implementation ---------- */
  private pendings = new Map<string, { resolve: (v: string | null) => void; reject: (e: Error) => void }>();

  ask(message: Call): Promise<string | null> {
    // // console.log(message);
    const id = crypto.randomUUID();
    return new Promise<string | null>((resolve, reject) => {
      this.pendings.set(id, { resolve, reject });
      this.callbacks.showTool({ 
        id: crypto.randomUUID(), 
        tool: {...message, status: "pending approval"}, 
        approvalId: id, 
        checkpoint: undefined 
      });
    });
  }

  handleApproval(id: string, result: string | null) {
    const p = this.pendings.get(id);
    if (!p) return;
    p.resolve(result);
    this.pendings.delete(id);
  }

  showToolCallResult(tc: any, args: any, output: string) {
    // this.updateUI(`\n> Task Completed!`);
    const resObj = {
      type: "function_call_output",
      call_id: tc.call_id,
      output: output,
      status: "resolved",
      args,
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
          this.callbacks.showTool({ id: ev.id, tool: { name: ev.name, args: "", status: "in_progress" } });
          activeToolCalls.set(ev.id, new StreamParamExtractor('content', ev.name));
          break;
        }

        case 'toolCallArgs': {
          buffer += ev.delta;
          // // console.log(ev.delta);
          const extractor = activeToolCalls.get(ev.id)!;
          extractor.feed(ev.delta);
          pathExtractor.feed(ev.delta);

          switch (extractor.getToolName()) {
            case 'propose_plan_md_file':
              proposePlan(extractor.getBuffer());
              break;

            case 'write_graph_yaml_file':
              graphCode.proposeGraph(extractor.getBuffer());
              // graphCode.showPreview();
              break;

            // case 'write_project_file':
            //   if (agentRole.agentRole === "code") {
            //     editorState.currSrcPath = pathExtractor.getBuffer();
            //     proposeCurrSrc(extractor.getBuffer());
            //     break;
            //   }
            default:
              console.log("here");
              this.callbacks.showTool({ id: ev.id, delta: ev.delta });
          }
          break;
        }

        case 'toolCallEnd': {
          const tc = {
            id: ev.id,
            call_id: ev.call_id,
            name: ev.name,
            args: ev.args
          };

          toolCalls.push(tc);
          activeToolCalls.delete(ev.id);
          break;
        }
      }
    }

    // // console.log(buffer);
    return { assistantContent, toolCalls };
  }
}