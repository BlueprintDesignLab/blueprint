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

type FileNode = {
    name: string;
    type: 'file' | 'folder';
    path: string;
    children?: FileNode[];
  };

type BPTool = Tool;