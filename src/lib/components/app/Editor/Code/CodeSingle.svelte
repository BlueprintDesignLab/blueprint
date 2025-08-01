<!-- CodeMirrorEditor.svelte -->
<script lang="ts">
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState, type Extension } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { onMount } from 'svelte';
  import { githubLight } from '@uiw/codemirror-theme-github';
  import { Shield } from 'lucide-svelte';

  interface Props {
    content?: string;
    theme?: 'light' | 'dark';
    readOnly?: boolean;
    lineWrapping?: boolean;
    lang?: () => Extension;
    onChange?: (content: string) => void;
    klass?: string;
  }

  let {
    content = $bindable(''),
    theme = 'light',
    readOnly = false,
    lineWrapping = false,
    lang = markdown,
    onChange = (content: string) => {},
    klass = '',
  }: Props = $props();

  let host: HTMLDivElement;
  let view: EditorView;

  function extensions(): Extension[] {
    return [
      basicSetup,
      githubLight,
      (lang ?? markdown)(),
      EditorView.theme(
        {
          '&': { 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          },
          '.cm-scroller': { 
            overflow: 'auto',
            flex: '1'
          },
        },
        { dark: theme === 'dark' }
      ),
      EditorView.editable.of(!readOnly),
      EditorState.readOnly.of(readOnly),
      ...(lineWrapping ? [EditorView.lineWrapping] : []),
      EditorView.updateListener.of((up) => {
        if (up.docChanged) {
          content = up.state.doc.toString();
          onChange(content);
        }
      }),
    ];
  }

  onMount(() => {
    view = new EditorView({
      parent: host,
      doc: content,
      extensions: extensions(),
    });

    return () => view.destroy();
  });

  $effect(() => {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  });
</script>

<!-- This will adapt to window height -->
<!-- CodeMirrorEditor.svelte -->
<div class="w-full h-full flex flex-col">
  <div class="flex-1 min-h-0">
    {#if readOnly}
      <div
        class="shrink-0 flex items-center gap-2 px-4 py-2
              bg-gradient-to-r from-white/10 via-amber-50/20 to-white/10
              text-amber-600 text-sm font-semibold select-none
              border-b border-white/10 backdrop-blur-sm"
      >
        <Shield />
        Read Only
      </div>
    {/if}
    <div bind:this={host} class="{klass} w-full h-full"></div>
  </div>
</div>