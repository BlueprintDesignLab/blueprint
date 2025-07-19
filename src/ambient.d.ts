type ChatRole = "user" | "assistant" | "developer";

type AgentModes = "plan" | "architect" | "code";


type ChatTurn = { 
    role: ChatRole, 
    content: string, 
    timestamp?: string 
};

type StreamDeltaFn = (delta: string) => void;
type ShowToolFn   = (tool: any) => void;

interface ApprovalGateway {
  ask(message: any): Promise<string | null>;
}

type LLMEvent =
  | { type: "text"; delta: string }
  | { type: "toolCallStart"; id: string; name: string }
  | { type: "toolCallArgs"; id: string; delta: string }
  | { type: "toolCallEnd"; id: string; name: string; args: string };

interface LLMStream {
  events(): AsyncIterable<LLMEvent>;
}