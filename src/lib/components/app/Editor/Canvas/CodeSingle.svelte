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
    onChange?: () => void;
    klass?: string;
  }

  let {
    content = $bindable(''),
    theme = 'light',
    readOnly = false,
    lineWrapping = false,
    lang = markdown,
    onChange = () => {},
    klass = '',
  }: Props = $props();

  let host: HTMLDivElement;
  let view: EditorView;

  /* build extensions once */
  function extensions(): Extension[] {
    return [
      basicSetup,
      (lang ?? markdown)(),
      EditorView.theme(
        {
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        },
        { dark: theme === 'dark' }
      ),
      EditorView.editable.of(!readOnly),
      EditorState.readOnly.of(readOnly),
      ...(lineWrapping ? [EditorView.lineWrapping] : []),
      EditorView.updateListener.of((up) => {
        if (up.docChanged) {
            onChange();
            content = up.state.doc.toString();
        }
      }),
    ];
  }

  /* mount once */
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

<div bind:this={host} class="{klass} w-full h-full"></div>