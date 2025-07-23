<script lang="ts">
  import { Handle, Position, useSvelteFlow } from '@xyflow/svelte';

  import type { NodeProps } from '@xyflow/svelte';
  import { Badge } from '$lib/components/ui/badge';

  import { saveGraphSemantic } from '$lib/util/graphIO';
  import { graphCode } from '$lib/state/graph.svelte';
  import { diffBlueprintGraph } from '$lib/util/graphDiff';
  import { onMount } from 'svelte';

  let { id, data = $bindable() }: NodeProps = $props();
  let aiStatus = $derived(data.aiStatus ?? '');

  graphCode.proposedSem = `nodes:
  UI:
    label: User Interface & Interaction
    main_file: src/UI.js
    comment: >
      Handles the onboarding, scenario selection, player choices, feedback
      display,

      and final recap. Pure browser JS/HTML/CSS; no dependencies. Talks to the

      scenario engine, content manager, feedback, and persistence modules.
  ScenarioEngine:
    label: Scenario Engine
    main_file: src/ScenarioEngine.js
    comment: >
      Runs the scenario logic: loading scenarios, progressing state,

      advancing choices, and integrating with feedback and persistence. Receives
      scenario

      structure/data from the content manager, returns current state and options
      to UI.
  ScenarioContentManager:
    label: Scenario Content Manager
    main_file: src/ScenarioContentManager.js
    comment: >
      Loads, validates, and lists pre-bundled scenario files from
      /src/scenarios/ (JS or JSON).

      Provides list, metadata, and content structures to the scenario engine. No
      async loading.
  FeedbackSystem:
    label: Feedback System
    main_file: src/FeedbackSystem.js
    comment: >
      Formats and delivers immediate, contextual, plain-language explanations
      for user choices.

      Receives scenario node, user choice, and player context to compose
      feedback.
  ProgressPersistence:
    label: Progress Persistence
    main_file: src/ProgressPersistence.js
    comment: >
      Manages all data stored in browser localStorage: scenario progress, user
      decisions,

      badge history, and reset/clear functions. Simple JS-only wrapper
  Thingy:
    label: Thingy
    main_file: src/lolx
edges:
  ui_engine:
    source: UI
    target: ScenarioEngine
    label: UI & Scenario Engine API
    interface_file: src/edges/interfaces/UIEngineInterface.js
    comment: >
      UI asks the engine for available scenarios, details of the current node,
      submits choices, triggers state advances, and requests outcomes.
  ui_persistence:
    source: UI
    target: ProgressPersistence
    label: UI & Progress Persistence
    interface_file: src/edges/interfaces/UIPersistenceInterface.js
    comment: >
      UI stores and retrieves progress, badge data, and reset/session info
      through

      this interface. All data local to the browser.
  ui_feedback:
    source: UI
    target: FeedbackSystem
    label: UI & Feedback System
    interface_ile: src/edges/interfaces/UIFeedbackInterface.js
    comment: >
      UI requests formatted, plain-language explanations of the impact of each
      user choice.

      Pure JS, contextualized for UI display.
  engine_content:
    source: ScenarioEngine
    target: ScenarioContentManager
    label: Engine & Content Manager
    interfaceFile: src/edges/interfaces/EngineContentInterface.js
    comment: >
      Scenario engine requests list of scenario files, fetches scenario
      data/structure

      by name or ID, and receives pre-parsed scenario objects.
  engine_feedback:
    source: ScenarioEngine
    target: FeedbackSystem
    label: Engine & Feedback System
    interfaceFile: src/edges/interfaces/EngineFeedbackInterface.js
    comment: >
      The scenario engine submits user choices and context to the feedback
      system, which

      returns descriptive, causal feedback for use in both UI and state
      tracking.
      `

  /* ---------- diff logic ---------- */
  // let semDerived = $derived(saveGraphSemantic(graphCode.getGraph()));
  // let diff = $derived(diffBlueprintGraph(semDerived, graphCode.proposedSem));
  graphCode.showPreview();

  $inspect(graphCode.previewGraph);

  /* pick one of the diff states (or empty string) */
  let diffClass = $derived.by(() => {
    let diffStatus = graphCode.previewGraph?.status.get(id);

    if (diffStatus === "added")    return 'border-green-500';
    if (diffStatus === "destroyed") return 'border-red-500';
    if (diffStatus === "modified")  return 'border-yellow-500';
    return 'border-neutral-300';
  });

  let ref: HTMLDivElement | null = $state(null);
  const { updateNode } = useSvelteFlow();
  
  onMount(() => {
    const ro = new ResizeObserver(() => {
      if (!ref) return;
      updateNode(id, {
        width: ref.offsetWidth,
        height: ref.offsetHeight
      });
    });
    
    ro.observe(ref!);
    return () => ro.disconnect();
  });
</script>

<!-- … same Handles … -->
<Handle type="source" position={Position.Top}    id="a" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Right}  id="b" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Bottom} id="c" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="source" position={Position.Left}   id="d" class="w-2 h-2 rounded-full bg-neutral-600" />

<Handle type="target" position={Position.Top}    id="a" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Right}  id="b" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Bottom} id="c" class="w-2 h-2 rounded-full bg-neutral-600" />
<Handle type="target" position={Position.Left}   id="d" class="w-2 h-2 rounded-full bg-neutral-600" />

<div
  bind:this={ref}
  class="auto-node border-2 {diffClass} w-24"
  class:animate-pulse={aiStatus === 'generating'}
>
  {#if aiStatus}
    <Badge variant="secondary" class="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5">
      AI: {aiStatus}
    </Badge>
  {/if}
  {data.label}
</div>

<style>
  .auto-node {
    position: relative;
    padding: 8px 12px;
    border-radius: 6px;
    background: #fff;
    font-size: 13px;
    width: max-content;
  }
</style>