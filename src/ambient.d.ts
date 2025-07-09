type ChatRole = "user" | "assistant" | "developer";

type ChatTurn = { 
    role: ChatRole, 
    content: string, 
    timestamp?: string 
};

type StreamDeltaFn = (delta: string) => void;
type ShowToolFn   = (tool: any) => void;


