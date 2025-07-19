<script lang="ts">
  import { onMount } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import '@xterm/xterm/css/xterm.css';
  import { spawn } from 'tauri-pty';
  import { invoke } from '@tauri-apps/api/core';

  import { SHELL_SENTINEL, TerminalController, terminalController } from '$lib/state/terminal.svelte';

  let container: HTMLDivElement;

  onMount(() => {
    const xTerm = new Terminal({ cursorBlink: true, fontFamily: 'monospace' });
    const fit = new FitAddon();
    xTerm.loadAddon(fit);
    xTerm.open(container);
    fit.fit();

    invoke("get_project_root").then((path) => {
      const pty = spawn('zsh', [],  { cols: xTerm.cols, rows: xTerm.rows, cwd: path as string});

      terminalController.controller = new TerminalController(xTerm, pty);
    });    

    const ro = new ResizeObserver(() => {
      fit.fit(),
      terminalController.controller?.resize();
    });
    ro.observe(container);

    return () => {
        ro.disconnect();
    }
  });
</script>

<style>
  .terminal-wrapper { 
    height: 100%; 
    width: 100%; 
    background: #000; 
  }
</style>

<div bind:this={container} class="terminal-wrapper"></div>