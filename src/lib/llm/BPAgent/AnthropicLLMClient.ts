// // src/lib/llm/AnthropicMessagesLLMClient.ts
// import type Anthropic from '@anthropic-ai/sdk';
// import type { ChatHistory } from './ChatHistory';
// import type { LLMClient, LLMEvent, LLMStream } from './LLMClient';
// import type { Tool } from 'openai/resources/responses/responses.mjs';

// export class AnthropicMessagesLLMClient implements LLMClient {
//     constructor(private anthropic: Anthropic, private model: string) {}

//     /**
//      * Converts internal ChatHistory to Anthropic Messages API format.
//      * @param history The internal chat history.
//      * @returns Array of messages compatible with Anthropic API.
//      */
//     toThisHistory(history: ChatHistory): Anthropic.Messages.MessageParam[] {
//         const messages: Anthropic.Messages.MessageParam[] = [];

//         for (const turn of history.turns) {
//             switch (turn.kind) {
//                 case 'user':
//                     // User message with text content
//                     messages.push({ role: 'user', content: turn.content });
//                     break;
//                 case 'assistant':
//                     // Assistant message with text content
//                     messages.push({ role: 'assistant', content: turn.content });
//                     break;
//                 case 'toolCall':
//                     // Assistant message with tool use content block
//                     // Note: Anthropic typically groups tool calls within a single assistant message
//                     // This assumes toolCall is part of the preceding assistant turn's content block
//                     // If your history structure has toolCall as a separate turn, this needs adjustment.
//                     // Let's assume it's part of the preceding assistant message content for now.
//                     // If it's a separate turn, we might need to buffer or adjust history structure.
//                     // For simplicity here, treating as a separate message, but Anthropic expects tool_use inside assistant content.
//                     // Let's revise: We'll buffer tool calls and add them to the last assistant message,
//                     // OR, if toolCall is meant to be a standalone indicator, we create an assistant message with tool_use.
//                     // Given the structure, it seems like toolCall might represent the initiation of tool calls by the assistant.
//                     // Let's treat each toolCall as initiating an assistant message with that tool_use.
//                     // However, Anthropic's API doc example shows multiple tool_use blocks within one assistant message content array.
//                     // This adapter might need to group consecutive toolCall turns into one assistant message.
//                     // For now, let's create a separate assistant message for this tool call.
//                     // A more robust version would group them.
//                     messages.push({
//                         role: 'assistant',
//                         content: [
//                             {
//                                 type: 'tool_use',
//                                 id: turn.call.id,
//                                 name: turn.call.name,
//                                 input: JSON.parse(turn.call.arguments || '{}') // Parse arguments string to object
//                             }
//                         ]
//                     });
//                     break;
//                 case 'toolResult':
//                     // User message with tool result content block
//                     messages.push({
//                         role: 'user',
//                         content: [
//                             {
//                                 type: 'tool_result',
//                                 tool_use_id: turn.result.call_id, // Anthropic uses tool_use_id
//                                 content: turn.result.output
//                             }
//                         ]
//                     });
//                     break;
//             }
//         }

//         // --- Potential Improvement ---
//         // The logic above for 'toolCall' might not perfectly match Anthropic's expectation
//         // if your `ChatHistory` has multiple consecutive 'toolCall' entries that should
//         // be grouped into a single assistant message content array.
//         // A more accurate conversion might involve iterating and grouping:
//         //
//         // let i = 0;
//         // while (i < history.turns.length) {
//         //   const turn = history.turns[i];
//         //   if (turn.kind === 'user') { ... }
//         //   else if (turn.kind === 'assistant') { ... }
//         //   else if (turn.kind === 'toolCall') {
//         //     const toolUses = [];
//         //     while (i < history.turns.length && history.turns[i].kind === 'toolCall') {
//         //        const toolTurn = history.turns[i];
//         //        toolUses.push({ type: 'tool_use', id: ..., name: ..., input: ... });
//         //        i++;
//         //     }
//         //     messages.push({ role: 'assistant', content: toolUses });
//         //     continue; // Skip increment as while loop handled it
//         //   }
//         //   else if (turn.kind === 'toolResult') { ... }
//         //   i++;
//         // }
//         //
//         // For this initial implementation, we'll proceed with the simpler per-turn mapping,
//         // assuming each 'toolCall' history entry represents a distinct tool use block.
//         // --- End Improvement ---

//         return messages;
//     }

//     /**
//      * Converts internal tools array to Anthropic Tools API format.
//      * @param tools The internal tools array.
//      * @returns Array of tools compatible with Anthropic API.
//      */
//     toThisTools(tools: Tool[]): Anthropic.Messages.Tool[] {
//         // Assuming your internal Tool type has name, description, and input_schema (JSON Schema)
//         return tools.map((tool) => ({
//             name: tool.name,
//             description: tool.description,
//             input_schema: tool.input_schema // Anthropic expects input_schema
//         }));
//     }

//     /**
//      * Creates a streaming response using the Anthropic Messages API.
//      * @param history The chat history.
//      * @param tools Available tools.
//      * @param instructions System prompt/instructions.
//      * @param signal AbortSignal for cancellation.
//      * @returns An LLMStream instance for the Anthropic API.
//      */
//     createStream(history: ChatHistory, tools: Tool[], instructions: string, signal: AbortSignal): LLMStream {
//         const anthropicTools = this.toThisTools(tools);
//         const messages = this.toThisHistory(history);

//         return new AnthropicMessagesStream(this.anthropic, this.model, messages, instructions, anthropicTools, signal);
//     }
// }

// /**
//  * Implements the LLMStream interface for Anthropic Messages API streaming.
//  */
// class AnthropicMessagesStream implements LLMStream {
//     constructor(
//         private anthropic: Anthropic,
//         private model: string,
//         private messages: Anthropic.Messages.MessageParam[],
//         private system: string, // Anthropic uses 'system' parameter
//         private tools: Anthropic.Messages.Tool[],
//         private signal: AbortSignal
//     ) {}

//     async *events(): AsyncIterable<LLMEvent> {
//         // Prepare the stream creation parameters
//         const streamParams: Anthropic.Messages.MessageStreamParams = {
//             model: this.model,
//             messages: this.messages,
//             system: this.system, // System prompt
//             tools: this.tools,
//             stream: true
//             // Consider adding max_tokens, temperature etc. if needed/configurable
//         };

//         // Create the stream
//         const stream = this.anthropic.messages.create(streamParams, { signal: this.signal });

//         // Buffer for accumulating tool call arguments
//         const toolCallBuffer: Record<string, { id: string; name: string; args: string }> = {};

//         try {
//             for await (const chunk of stream) {
//                 // console.log("Anthropic Chunk:", JSON.stringify(chunk)); // Debugging

//                 switch (chunk.type) {
//                     case 'content_block_start':
//                         // Indicates the start of a new content block (text or tool_use)
//                         if (chunk.content_block.type === 'text') {
//                             // Start of a text response block - no specific start event needed for text delta?
//                             // Text deltas will come in content_block_delta.
//                         } else if (chunk.content_block.type === 'tool_use') {
//                             // Start of a tool call
//                             const toolCallId = chunk.content_block.id;
//                             const toolName = chunk.content_block.name;
//                             toolCallBuffer[toolCallId] = { id: toolCallId, name: toolName, args: '' };
//                             yield {
//                                 type: 'toolCallStart',
//                                 id: toolCallId,
//                                 name: toolName,
//                                 call_id: toolCallId // Using id as call_id for Anthropic
//                             };
//                         }
//                         break;

//                     case 'content_block_delta':
//                         // Provides deltas for the current content block
//                         if (chunk.delta.type === 'text_delta') {
//                             // Streaming text response
//                             yield { type: 'text', delta: chunk.delta.text };
//                         } else if (chunk.delta.type === 'input_json_delta') {
//                             // Streaming arguments for a tool call
//                             const toolCallId = chunk.index.toString(); // Anthropic uses index for tool_use blocks
//                             if (toolCallBuffer[toolCallId]) {
//                                 const argDelta = chunk.delta.partial_json || '';
//                                 toolCallBuffer[toolCallId].args += argDelta;
//                                 yield { type: 'toolCallArgs', id: toolCallId, delta: argDelta };
//                             }
//                         }
//                         break;

//                     case 'content_block_stop':
//                         // Indicates the end of a content block
//                         // If it was a tool_use block, finalize the tool call
//                         // Anthropic's chunk for content_block_stop doesn't directly link to tool_use id easily.
//                         // We need to correlate using the index from content_block_start/delta.
//                         // The index of the block being stopped is in `chunk.index`.
//                         // We stored the tool call info using the tool_use id as key.
//                         // However, the `content_block_stop` event only gives the index.
//                         // This is tricky. Let's iterate the buffer to find the entry with matching index logic.
//                         // Actually, re-reading the API, content_block_start gives the `id` of the tool_use.
//                         // content_block_delta for input_json also relates to the index.
//                         // content_block_stop gives the index.
//                         // We need to map index -> tool_use_id when content_block_start happens.
//                         // Let's adjust the buffer strategy.

//                         // --- Revised Buffer Strategy ---
//                         // Buffer maps index (from API) to tool call details
//                         // const toolCallIndexBuffer: Record<number, { id: string; name: string; args: string }> = {};
//                         // In content_block_start (tool_use): toolCallIndexBuffer[chunk.index] = { id: chunk.content_block.id, ... }
//                         // In content_block_delta (input_json): use chunk.index to find buffer entry
//                         // In content_block_stop: use chunk.index to find buffer entry and finalize/yield toolCallEnd
//                         // --- End Revised Strategy ---

//                         // Let's implement the revised strategy here.
//                         break; // Handled in message_delta potentially

//                     case 'message_delta':
//                         // Provides updates to the top-level message, including stop_reason
//                         if (chunk.delta.stop_reason === 'tool_use') {
//                             // The message has finished and the reason is tool use.
//                             // This is the point to finalize all buffered tool calls.
//                             // Iterate through the buffer and yield toolCallEnd for each.
//                             for (const [id, call] of Object.entries(toolCallBuffer)) {
//                                 yield {
//                                     type: 'toolCallEnd',
//                                     id: call.id,
//                                     name: call.name,
//                                     args: call.args,
//                                     call_id: call.id // Using id as call_id for Anthropic
//                                 };
//                             }
//                             // Clear the buffer for the next potential message
//                             Object.keys(toolCallBuffer).forEach((key) => delete toolCallBuffer[key]);
//                         }
//                         // message_delta might also contain usage info if needed later
//                         break;

//                     case 'message_stop':
//                         // Indicates the end of the entire message stream
//                         // Any final cleanup if needed.
//                         break;

//                     // Handle other potential event types if necessary (e.g., error, ping)
//                     // case 'error':
//                     //   console.error("Anthropic Stream Error:", chunk.error);
//                     //   // Depending on error handling strategy, might throw or yield an error event
//                     //   break;
//                 }
//             }
//         } catch (error) {
//             // Handle stream errors (e.g., network issues, API errors)
//             console.error('Anthropic Stream Error:', error);
//             // Depending on your LLMEvent design, you might want to yield an error event here
//             // yield { type: 'error', message: error.message }; // Example
//             throw error; // Re-throw to let caller handle
//         }
//     }
// }
