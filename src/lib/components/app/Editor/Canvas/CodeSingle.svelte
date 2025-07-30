<!-- CodeMirrorEditor.svelte -->
<script lang="ts">
  import { EditorView, basicSetup } from 'codemirror';
  import { EditorState, type Extension } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { onMount } from 'svelte';

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
    <div bind:this={host} class="{klass} w-full h-full"></div>
  </div>
</div>