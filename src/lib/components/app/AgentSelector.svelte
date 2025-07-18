<script lang="ts">
    import { focus } from "$lib/state/focus.svelte";

    let currFocusMode = $derived(focus.mode);

    function changeVal(val: "plan" | "architect" | "develop") {
        focus.mode = val;   // update only when different
    }
</script>

<div class="flex flex-row space-x-2">
  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {currFocusMode === 'plan'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {currFocusMode === 'plan'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("plan")}
  >
    Plan
  </button>

  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {currFocusMode === 'architect'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {currFocusMode === 'architect'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("architect")}
  >
    Architect
  </button>
  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {currFocusMode === 'develop'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {currFocusMode === 'develop'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("develop")}
  >
    develop
  </button>
</div>