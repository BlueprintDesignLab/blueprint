import stripAnsi from 'strip-ansi';
import type { Terminal } from '@xterm/xterm';
import { type IPty } from 'tauri-pty';

export const terminalController: { controller: TerminalController | null } = {
  controller: null
};

export class TerminalController {
  private pty: IPty;
  private xterm: Terminal;
  private dispose: () => void;

  constructor(xterm: Terminal, pty: IPty) {
    this.xterm = xterm;
    this.pty = pty;

    // Normal plumbing
    const unl = pty.onData((chunk) => xterm.write(chunk));
    this.dispose = unl.dispose.bind(unl);
    xterm.onData((d) => pty.write(d));
  }

  resize() {
    this.pty.resize(this.xterm.cols, this.xterm.rows);
  }

  /** Run a command and return its stdout */
  async run(cmd: string): Promise<string> {
    let buffer = '';
    const unlisten = this.pty.onData((c) => (buffer += c));
    
    // Generate unique marker
    const marker = `__BLUEPRINT_DONE_${Date.now()}_`;
    
    // Execute command with marker
    this.pty.write(`${cmd}; echo "${marker}"\n`);

    // Wait for marker
    while (!buffer.includes(marker)) {
      await new Promise(r => setTimeout(r, 50));
    }

    unlisten.dispose();

    // Process output
    const markerIndex = buffer.indexOf(marker);
    const output = buffer.substring(0, markerIndex);
    const lines = stripAnsi(output).split('\n');
    const final = lines.slice(1).join('\n');

    console.log(final);
    return final; 
  }

  destroy() {
    this.dispose();
  }
}