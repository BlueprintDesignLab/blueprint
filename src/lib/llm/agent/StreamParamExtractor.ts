/**
 * Streaming extractor that pulls a single string parameter out of
 *   {"type":"response.function_call_arguments.delta", ... ,"key":"value"}
 * style deltas.
 */
export class StreamParamExtractor {
  private readonly key: string;
  private state: 'idle' | 'prefix' | 'value' = 'idle';
  private buffer = '';
  private escaped = false;
  private toolName;

  constructor(key: string, toolName: string) {
    this.key = `"${key}":"`;
    this.toolName = toolName;
  }

  feed(chunk: string | Buffer): string | undefined {
    const str = typeof chunk === 'string' ? chunk : chunk.toString('utf8');

    for (const ch of str) {
      if (this.state === 'idle') {
        // Fast prefix match
        this.buffer += ch;
        if (this.buffer.endsWith(this.key)) {
          this.state = 'value';
          this.buffer = '';
          this.escaped = false;
        }
        continue;
      }

      // --- inside the value ---
      if (this.escaped) {
        switch (ch) {
          case 'n':  this.buffer += '\n'; break;
          case 't':  this.buffer += '\t'; break;
          case 'r':  this.buffer += '\r'; break;
          case '\\': this.buffer += '\\'; break;
          case '"':  this.buffer += '"';  break;
          default:   this.buffer += ch;   // keep unknown escapes literally
        }
        this.escaped = false;
      } else if (ch === '\\') {
        this.escaped = true;
      } else if (ch === '"') {
        // closing quote → value complete
        const result = this.buffer;
        this.reset();
        return result;
      } else {
        this.buffer += ch;
      }
    }
    return undefined; // still streaming
  }

  getToolName() {
    return this.toolName;
  }

  getBuffer() {
    return this.buffer;
  }

  /**
   * Manually reset the extractor (useful on stream end / abort).
   */
  reset(): void {
    this.state = 'idle';
    this.escaped = false;
  }
}