import type { Terminal } from '@xterm/xterm';
import { type IPty } from 'tauri-pty';

import stripAnsi from 'strip-ansi';

export const terminalController: {controller: TerminalController | null}= {
  controller: null
}

export const SHELL_SENTINEL = "<BLUEPRINT_SHELL>";

export class TerminalController {
  private pty: IPty;
  private xterm: Terminal;
  private currentResolver: ((s: string) => void) | null = null;

  // NEW: track streaming scrub state
  private running = false;
  private buffer = "";

  private firstSentinel = false;

  constructor(xterm: Terminal, pty: IPty) {
    this.xterm = xterm;
    this.pty = pty;

    pty.write('export PS1="' + SHELL_SENTINEL + '"\n');
    pty.write('clear\n');

    this.setUpPtyToXTerm();
    this.xterm.onData((d) => this.pty.write(d));
    // setTimeout(() => this.setUpPtyToXTerm(), 500);
  }

  setUpPtyToXTerm() {
    this.pty.onData((chunk) => {
      this.buffer += stripAnsi(chunk);
      console.log(this.buffer);
      
      // if (this.buffer.includes(SHELL_SENTINEL)) {
      //   this.firstSentinel = true;
      // }

      // if (!this.firstSentinel) return;

      if (this.running && this.buffer.includes(SHELL_SENTINEL)) {
        const lines = this.buffer.split('\n');
        const cleaned = lines.slice(1, -1).join('\n');
        console.log(cleaned);
        this.currentResolver?.(cleaned);
        this.pty.write('\n');
        this.reset();
        return; // Do not write the sentinel or trailing prompt
      }

      this.xterm.write(chunk);
    });
  }

  resize() {
    this.pty.resize(this.xterm.cols, this.xterm.rows);
  }

  /** public API: run a shell line, return stdout as string */
  run(cmd: string): Promise<string> {
    if (this.currentResolver) throw new Error("command already running");

    this.buffer = "";

    return new Promise<string>((resolve) => {
      this.currentResolver = resolve;
      const command = `${cmd}\n`;
      this.pty.write(command);
      this.running = true;
    });
  } 

  private reset() {
    this.currentResolver = null;
    this.buffer = "";
    this.running = false;
  }
}