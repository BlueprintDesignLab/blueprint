<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  import MdRenderer from "./MDRenderer.svelte";
  import { GlobalAgent } from "$lib/llm/agent"

  import { invoke } from '@tauri-apps/api/core';
  import { tick } from "svelte";

  let ch: any = $state([]);
  let chDiv: HTMLDivElement | null = $state(null);

  let question = $state("");

  // $inspect(ch);

  $effect.pre(() => {
    if (!ch[ch.length - 1]?.content) return;
    ch[ch.length - 1].content;

    if (!chDiv) return;

    const autoscroll =
      chDiv.offsetHeight + chDiv.scrollTop > chDiv.scrollHeight - 50;

    if (autoscroll) {
      tick().then(() => {
        chDiv = chDiv as HTMLDivElement;
        chDiv.scrollTo(0, chDiv.scrollHeight);
      });
    }
  });

  function updateUI(delta:string) {
    ch[ch.length - 1].content += delta;
  }

  let agent = new GlobalAgent([], [], updateUI)

  const send = async () => {
    const userMessage: ChatTurn = {
      role: "user",
      content: question
    }

    ch.push(userMessage);
    question = "";

    agent.run(userMessage);

    const responseRender = $state({
      role: "assistant",
      content: ""
    })

    ch.push(responseRender);
  };

  export function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter":
          if (!event.shiftKey) {
            event.preventDefault(); // Prevent the default Enter behavior (newline)
            send();
          }
          // If Shift is held, do nothing special: the default behavior will insert a newline
          if (event.shiftKey) {
            event.preventDefault(); // Prevent the default Enter behavior (newline)
            send();
          }
        break;
    }
  }
</script>


<div class="flex flex-col h-screen max-w-xl mx-auto p-4">
  <div bind:this={chDiv} class="flex-1 overflow-auto space-y-2 p-2 bg-muted rounded-xl border">
    {#each ch as chItem}
      {chItem.role}
      <div class="bg-background border rounded-lg p-3 shadow-sm">
        <MdRenderer content={chItem.content}/>
      </div>
    {/each}
  </div>

  <!-- Input area -->
  <div class="mt-4 flex items-center gap-2">
    <Input bind:value={question} onkeydown={(e) => handleKeyDown(e)} class="flex-1" placeholder="Type your message..."/>
    <Button onclick={send}>send</Button>
  </div>
</div>


