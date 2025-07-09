<script lang="ts">
  import { onMount } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import '@xterm/xterm/css/xterm.css';
  import { spawn, type IPty } from 'tauri-pty';
  import { invoke } from '@tauri-apps/api/core';

  let container: HTMLDivElement;
  let pty: IPty | null = null;
  let ro: ResizeObserver;

  onMount(async () => {
    const term = new Terminal({ cursorBlink: true, fontFamily: 'monospace' });
    const fit  = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    fit.fit();

    const path: string = await invoke("get_project_root");
    console.log(path);

    pty = spawn("zsh", [], { cols: term.cols, rows: term.rows, cwd: path });

    pty.onData(data => term.write(data));
    term.onData(data => pty!.write(data));

    // window.addEventListener('resize', () => {
    //   fit.fit();
    //   pty!.resize(term.cols, term.rows);
    // });

    // 🔄 keep in sync whenever THIS pane resizes
    ro = new ResizeObserver(() => {
      fit.fit();
      pty?.resize(term.cols, term.rows);
    });
    ro.observe(container);

    return () => {
        ro.disconnect();
    }
  });

  export function runByAgent(cmd: string) {
    // if (!auto && !confirm(`Run "${cmd}"?`)) return;
    // const coloured = `\x1b[1;32m🤖 ${cmd}\x1b[0m\n`;
    // container?.querySelector('.xterm')?.dispatchEvent(
    //   new CustomEvent('write', { detail: coloured })
    // );
    pty!.write?.(cmd + '\n');
  }
</script>

<style>
  .terminal-wrapper { 
    height: 100%; 
    width: 100%; 
    background: #000; 
  }
</style>

<div bind:this={container} class="terminal-wrapper" />