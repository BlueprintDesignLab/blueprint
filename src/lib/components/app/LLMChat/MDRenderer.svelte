<script lang="ts">
  import { Marked } from "marked";
  import { markedHighlight } from "marked-highlight";

  import markedKatex from "marked-katex-extension";
  import hljs from "highlight.js";

  import { Copy, CopyCheck } from "lucide-svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  interface Props {
    content: string
  }

  let { content }: Props = $props();

  const marked = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      /**
       * @param {string} code
       * @param {string} lang
       */
      // @ts-ignore
      highlight(code, lang, _) {
        if (lang === "svelte") {
          lang = "javascript";
        }

        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    })
  );

  const options = {
    throwOnError: false,
  };

  marked.use(markedKatex(options));

  let parsed = $derived.by(() => {
    // const replacedInline = replaceInlineDelimiters(content);
    // const replacedBlock = replaceBlockDelimiters(replacedInline);

    // @ts-ignore
    const parsed = marked.parse(content ?? "");
    return parsed;
  });

  // @ts-ignore
  let sections = $derived(splitCodeBlocks(parsed));

  function replaceBlockDelimiters(text: string) {
    const regex = /\\\[.*?\\\]/gs;
    const replaced = text.replace(regex, (match) => {
      return `\n\`\`\`tex\n${match}\n\`\`\`\n$$\n${match.slice(2, -2)}\n$$\n`;
    });
    return replaced;
  }

  function replaceInlineDelimiters(text: string) {
    const regex = /\\\(.*?\\\)/g;
    const replaced = text.replace(regex, (match) => {
      return `$${match.slice(2, -2)}$`;
    });
    return replaced;
  }


  function splitCodeBlocks(text: string) {
    const regex = /<pre[^>]*>[\s\S]*?<\/pre>/g;

    const nonCode = text.split(regex);
    const code = text.match(regex) ?? [];

    /**
     * @type {[string, string][]}
     */
    const newSections = [];

    for (let i = 0; i < nonCode.length; i++) {
      newSections.push(["text", nonCode[i]]);
      if (code[i]) {
        newSections.push(["code", code[i]]);
      }
    }

    return newSections;
  }

  function stripHtml(html: string) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  let copyButtonChecked = $state(-1);

  async function copyToClipboard(rawHtml: string, index: number) {
    const text = stripHtml(rawHtml);      // plain text
    try {
      // Try the richer API first (Chromium, Firefox 122+, Edge).
      if (navigator.clipboard.write) {
        const item = new ClipboardItem({
          // Provide BOTH flavours so every target can paste something.
          "text/plain": new Blob([text], { type: "text/plain" }),
          "text/html":  new Blob([rawHtml], { type: "text/html" })
        });
        await navigator.clipboard.write([item]);
      } else {
        // Fallback for Safari / older Firefox
        await navigator.clipboard.writeText(text);
      }

      copyButtonChecked = index;
      setTimeout(() => (copyButtonChecked = -1), 3000);
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  }
</script>

<div class="wholeBlock space-y-6">
  {#if content === ""}
    <div class="w-40 mx-auto pt-5 text-center text-muted-foreground text-sm animate-pulse">
      AI is thinking…
    </div>
  {/if}

  {#each sections as section, i}
    {#if section[0] === "code" && section[1].includes("hljs")}
      <div class="relative">
        <!-- actual highlighted code comes in as HTML -->
        <pre class="rounded-xl overflow-auto bg-zinc-900 text-zinc-100 p-4 font-mono text-sm shadow-sm border border-zinc-800">
          {@html section[1]}
        </pre>

        <!-- Always‑visible action buttons -->
        <div class="absolute top-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onclick={() => copyToClipboard(section[1], i)}
          >
            {#if copyButtonChecked === i}
              <CopyCheck class="w-4 h-4 mr-1" />
            {:else}
              <Copy class="w-4 h-4 mr-1" />
            {/if}
            Copy
          </Button>

          <!-- {#if section[1].includes("language-yaml") && section[1].includes("nodes")}
            <Button
              size="sm"
              variant="secondary"
              onclick={() => /* TODO: emit event or handle graph set */ null}
            >
              Set Graph
            </Button>
          {/if} -->
        </div>
      </div>
    {:else}
      <!-- 🟢 MARKDOWN / RICH TEXT -->
      <article class="prose prose-neutral dark:prose-invert max-w-none">
        <span class="text-container" data-testid="responseContent">{@html section[1]}</span>
      </article>
    {/if}
  {/each}
</div>

