<script lang="ts">
  import { useNodes, useSvelteFlow, type Node } from "@xyflow/svelte";

  import * as Dialog from "$lib/components/ui/dialog/index.js";

  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  import { Plus } from "lucide-svelte";

  const nodes = useNodes();

  let open = $state(false);

  let currtype = $state("component");
  let currName = $state("");
  let exists = $derived(nodes.current.some((node) => node.id === currName));

  const opts = ["context", "container", "component", "code"];

  function pick(t: string) {
    currtype = t;
  }

  const { getViewport } = useSvelteFlow();

  function addNode(e: SubmitEvent) {
    e.preventDefault();

    const pane = document
      ?.querySelector(".svelte-flow__pane")
      ?.getBoundingClientRect();

    if (!pane) {
      alert("no pane");
      return;
    }

    const { width, height } = pane;
    const { x, y, zoom } = getViewport();

    const centreX = (-x + (width - 140) / 2) / zoom;
    const centreY = (-y + (height - 80) / 2) / zoom;

    const id = currName.toLowerCase().replace(' ', '_');

    const newNode: Node = {
      id,
      type: "c4FlowNode",
      position: {
        x: centreX,
        y: centreY,
      },
      width: 140,
      height: 80,
      data: {
        label: currName,
        type: currtype,
        // role: roleViaFD,
      },
    };

    nodes.update((curr) => {
      return [...curr, newNode];
    });

    currName = "";
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    <Button variant="outline" size="sm">
      <Plus class="w-4 h-4" />
      Create new node
    </Button>
  </Dialog.Trigger>

  <Dialog.Content>
    <Dialog.Header>
      <!-- compact, centered panel -->
      <form
        class="flex flex-col gap-6 w-full max-w-md mx-auto"
        onsubmit={(e) => {
          addNode(e);
          open = false;
        }}
      >
        <Dialog.Title class="text-xl font-semibold">
          Create a new node
        </Dialog.Title>

        <div class="grid grid-cols-4 items-center gap-3">
          <Label for="name">Label</Label>

          <Input
            id="name"
            name="name"
            class="col-span-3"
            bind:value={currName}
          />

          {#if exists}
            <!-- full–row message, small red text, a touch of negative-margin to tuck it closer -->
            <p class="col-span-4 -mt-2 text-xs text-red-600">
              A node with this ID already exists.
            </p>
          {/if}
        </div>

        <!-- ── Type (context / container / component / code) ─────────────── -->
        <div class="grid grid-cols-4 items-center gap-3">
          <Label for="type">Type</Label>

          <div
            class="col-span-3 grid grid-cols-4 gap-px rounded-lg overflow-hidden border border-border"
          >
            {#each opts as t}
              <Button
                onclick={() => pick(t)}
                class={`w-full text-sm rounded-none
              ${
                t === currtype
                  ? "bg-primary text-primary-foreground ring-2 ring-ring"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
                style="padding-block:0.5rem"
                type="button"
              >
                {t}
              </Button>
            {/each}
          </div>
        </div>

        <!-- ── Role (optional free-text) ──────────────────────────────────── -->
        <!-- <div class="grid grid-cols-4 items-center gap-3">
          <Label for="role">Role</Label>
          <Input
            id="role"
            name="role"
            placeholder="controller / service / repo…"
            class="col-span-3"
          />
        </div> -->

        <!-- ── Action row ────────────────────────────────────────────────── -->
        <div class="flex justify-end gap-4 pt-2">
          <Button type="submit" disabled={exists}>Create</Button>
          <Button type="button" variant="ghost" onclick={() => (open = false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
