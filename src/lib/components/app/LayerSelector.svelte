<script lang="ts">
  import { useEdges, useNodes } from "@xyflow/svelte";

  const nodes = useNodes();
  const edges = useEdges();

  let value = $state("-1");

  function updateLayerVis(layer: number) {
    nodes.update((nodes) => {
      return nodes.map((node) => {
        const nodeLayer = getNodeLayer(node.data.type as string);
        const visible = nodeLayer === layer || nodeLayer === layer + 1;
        return {
          ...node,
          hidden: !visible,
        };
      });
    });
    edges.update((edges) => {
      return edges.map((edge) => {
        const sourceNode = nodes.current.find((n) => edge.source === n.id)!;

        const nodeLayer = getNodeLayer(sourceNode.data.type as string);
        const visible = nodeLayer === layer;
        return {
          ...edge,
          hidden: !visible,
        };
      });
    });
  }

  function getNodeLayer(nodeType: string) {
    const order = ["context", "container", "component", "code"];
    const i = order.indexOf(nodeType);
    return i;
  }

  function allVis() {
    nodes.update((nodes) => {
      return nodes.map((node) => {
        return {
          ...node,
          hidden: false,
        };
      });
    });
    edges.update((edges) => {
      return edges.map((edge) => {
        return {
          ...edge,
          hidden: false,
        };
      });
    });
  }

  function changeVal(newVal: string) {
    if (value === newVal) {
      return;
    }

    if (newVal === "-1") {
      value = newVal;
      allVis();
      return;
    }

    value = newVal;
    updateLayerVis(parseInt(newVal));
  }
</script>

<div class="flex flex-row space-x-2">
  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {value === '-1'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {value === '-1'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("-1")}
  >
    All
  </button>

  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {value === '0'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {value === '0'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("0")}
  >
    Context
  </button>
  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {value === '1'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {value === '1'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("1")}
  >
    Container
  </button>
  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {value === '2'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {value === '2'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("2")}
  >
    Component
  </button>
  <button
    class="px-3 py-1 rounded text-sm"
    style="border: {value === '3'
      ? '2px solid #3b82f6'
      : '1px solid #d1d5db'}; background-color: {value === '3'
      ? '#eff6ff'
      : '#ffffff'};"
    onclick={() => changeVal("3")}
  >
    Code
  </button>
</div>
