export class StreamParamExtractor {
  private readonly key: string;
  private readonly toolName: string;
  private done = false;               // single-use flag

  private state: 'idle' | 'key' | 'sep' | 'value' = 'idle';
  private depth = 0;
  private inString = false;
  private escaped = false;

  private keyBuffer = '';
  private valueBuffer = '';

  constructor(key: string, toolName: string) {
    this.key = key;
    this.toolName = toolName;
  }

  feed(chunk: string | Buffer): string | undefined {
    if (this.done) return undefined;     // single-use guard

    const str = typeof chunk === 'string' ? chunk : chunk.toString('utf8');

    for (const ch of str) {
      switch (this.state) {
        case 'idle':
          if (ch === '"') {
            this.keyBuffer = '"';
            this.state = 'key';
          }
          if (!this.inString) {
            if (ch === '{') this.depth++;
            else if (ch === '}') this.depth--;
          }
          break;

        case 'key':
          this.keyBuffer += ch;
          if (this.escaped) {
            this.escaped = false;
          } else if (ch === '\\') {
            this.escaped = true;
          } else if (ch === '"') {
            this.state = this.keyBuffer === `"${this.key}"` ? 'sep' : 'idle';
            this.escaped = false;
          }
          break;

        case 'sep':
          if (ch === ':') this.state = 'value';
          break;

        case 'value':
          if (!this.inString) {
            if (ch === '"') { this.inString = true; continue; }
            if (ch <= ' ') continue;
            this.done = true;            // not a string ⇒ give up
            return undefined;
          }

          if (this.escaped) {
            switch (ch) {
              case 'n': this.valueBuffer += '\n'; break;
              case 't': this.valueBuffer += '\t'; break;
              case 'r': this.valueBuffer += '\r'; break;
              case '\\': this.valueBuffer += '\\'; break;
              case '"': this.valueBuffer += '"'; break;
              default: this.valueBuffer += ch;
            }
            this.escaped = false;
          } else if (ch === '\\') {
            this.escaped = true;
          } else if (ch === '"') {
            this.done = true;            // value complete
            return this.valueBuffer;
          } else {
            this.valueBuffer += ch;
          }
          break;
      }
    }
    return undefined;
  }

  getToolName(): string { return this.toolName; }

  getBuffer(): string {return this.valueBuffer; }
}