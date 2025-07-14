<script lang="ts">
  import {
    Handle,
    NodeResizer,
    Position,
    useSvelteFlow,
    useNodes,
    type NodeProps,
  } from "@xyflow/svelte";

  let { id, width, height, data = $bindable(), selected }: NodeProps = $props();

  const { updateNodeData } = useSvelteFlow();

  let label = $derived(data.label);
</script>
  <div class="node">
    
  <NodeResizer
    minWidth={100}
    minHeight={30}
    isVisible={selected}
    color="rgb(255, 64, 0)"
  />

  <Handle type="source" position={Position.Top} id="a" class="handle" />
  <Handle type="source" position={Position.Right} id="b" class="handle" />
  <Handle type="source" position={Position.Bottom} id="c" class="handle" />
  <Handle type="source" position={Position.Left} id="d" class="handle" />

  <Handle type="target" position={Position.Top} id="a" class="handle" />
  <Handle type="target" position={Position.Right} id="b" class="handle" />
  <Handle type="target" position={Position.Bottom} id="c" class="handle" />
  <Handle type="target" position={Position.Left} id="d" class="handle" />

  <div
    style={`
      width: ${width}px;
      height: ${height}px;
      padding: 10px;
      border: 2px solid #333;
      border-radius: 4px;
      background: white;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 4px;
      position: relative;    /* so the + button can be absolutely positioned */
    `}
  >
    <!-- editable label -->
    <input
      class="nodrag"
      style="
        width: 90%;
        text-align: center;
        font-weight: 600;
        border: none;
        outline: none;
        background: transparent;
      "
      bind:value={label}
      onchange={() => {
        // console.log(label);
        updateNodeData(id, { label: label });
      }}
    />
  </div>
</div>