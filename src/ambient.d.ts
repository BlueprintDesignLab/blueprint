declare global {
  // Pull the type in *inside* the declaration
  type BPTool = import('openai/resources/responses/responses.mjs').Tool;
}

type ChatRole = "user" | "assistant" | "developer";

type AgentRoles = "plan" | "architect" | "code";

type ChatTurn = { 
    role: ChatRole, 
    content: string, 
    timestamp?: string 
};

type StreamDeltaFn = (delta: string) => void;
type ShowToolFn   = (tool: any) => void;

type LLMEvent =
  | { type: "text"; delta: string }
  | { type: "toolCallStart"; id: string; name: string }
  | { type: "toolCallArgs"; id: string; delta: string }
  | { type: "toolCallEnd"; id: string; name: string; args: string };

interface LLMStream {
  events(): AsyncIterable<LLMEvent>;
}

type BPTool = Tool;