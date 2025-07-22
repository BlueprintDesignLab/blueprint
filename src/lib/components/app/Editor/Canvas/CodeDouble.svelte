<!-- CodeMirrorDiff.svelte -->
<script lang="ts">
  import { MergeView } from '@codemirror/merge';
  import { EditorState, type Extension } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { basicSetup, EditorView } from 'codemirror';
  import { onMount } from 'svelte';

  interface Props {
    content?: string;
    propose?: string;
    theme?: 'light' | 'dark';
    readOnly?: boolean;
    lineWrapping?: boolean;
    lang?: () => Extension;
    onChangecontent?: () => void;
    onChangepropose?: () => void;
    klass?: string;
  }

  let {
    content = $bindable(''),
    propose = $bindable(''),
    theme = 'light',
    readOnly = false,
    lineWrapping = false,
    lang = markdown,
    onChangecontent = () => {},
    onChangepropose = () => {},
    klass = '',
  }: Props = $props();

  let host: HTMLDivElement;
  let view: MergeView;

  function extensions(): Extension[] {
    return [
      basicSetup,
      (lang ?? markdown)(),
      EditorState.readOnly.of(readOnly),
      EditorView.theme(
        {
            // each individual editor pane (left, right, gap)
            '.cm-editor': { height: '100%' },
        },
        { dark: theme === 'dark' }
      ),
      ...(lineWrapping ? [EditorView.lineWrapping] : []),
    ];
  }

  function makecontentListener(cb: () => void) {
    return EditorView.updateListener.of((up) => {
      if (up.docChanged) {
        cb();

        content = up.state.doc.toString();
      }
    });
  }

  function makeproposeListener(cb: () => void) {
    return EditorView.updateListener.of((up) => {
      if (up.docChanged) {
        cb();

        propose = up.state.doc.toString();
      }
    });
  }

  onMount(() => {
    const ext = extensions();
    view = new MergeView({
      parent: host,
      a: {
        doc: content,
        extensions: [...ext, makecontentListener(onChangecontent)],
      },
      b: {
        doc: propose,
        extensions: [...ext, makeproposeListener(onChangepropose)],
      },
    });

    return () => view.destroy();
  });

  $effect(() => {
    if (!view) return;
    const aDoc = view.a.state.doc.toString();
    if (aDoc !== content) {
      view.a.dispatch({ changes: { from: 0, to: aDoc.length, insert: content } });
    }
  });

  $effect(() => {
    if (!view) return;
    const bDoc = view.b.state.doc.toString();
    if (bDoc !== propose) {
      view.b.dispatch({ changes: { from: 0, to: bDoc.length, insert: propose } });
    }
  });
</script>

<div bind:this={host} class="{klass} w-full h-full" style="display:flex; overflow:hidden;"></div>