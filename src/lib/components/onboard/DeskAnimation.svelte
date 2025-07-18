<script lang="ts">
  import { Spring } from 'svelte/motion';
  import { onMount } from 'svelte';

  let canvas = $state<HTMLCanvasElement>();
  let ctx    = $state<CanvasRenderingContext2D>();
  let dpr    = 1;
  let w = $state(0);
  let h = $state(0);

  /* ruler definitions -------------------------------------------------- */
  const size   = 120;        // outer square side
  const thick  = 20;         // wall thickness
  const tick   = 10;         // spacing between ticks
  const tickLen = 4;         // tick length
  const pad = 20;

  type Ruler = {
    x: number;
    y: number;
    dx: Spring<number>;
    dy: Spring<number>;
    rot: Spring<number>;
  };

  let rulers: Ruler[] = [];

  /* ------------------------------------------------------------------- */
  onMount(() => {
    ctx = canvas!.getContext('2d')!;
    dpr = window.devicePixelRatio || 1;

    const resize = () => {
      w = innerWidth;
      h = innerHeight;
      canvas!.width  = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width  = w + 'px';
      canvas!.style.height = h + 'px';
      ctx!.scale(dpr, dpr);


      /* rebuild rulers so corners stay exact after resize */
      rulers = [
        { x: pad,           y: pad           }, // top-left
        { x: w - size - pad,    y: pad           }, // top-right
        { x: pad,           y: h - size - pad   }, // bottom-left
        { x: w - size - pad,    y: h - size - pad    }  // bottom-right
      ].map(r => ({
        ...r,
        dx:  new Spring(0, { stiffness: 0.01, damping: 0.5 }),
        dy:  new Spring(0, { stiffness: 0.01, damping: 0.5 }),
        rot: new Spring(0, { stiffness: 0.01, damping: 0.5 })
      }));
    };

    resize();
    addEventListener('resize', resize);

    /* gentle 20-second drift for each ruler */
    rulers.forEach(r => {
      let dir = 1;
      const cycle = () => {
        dir *= -1;
        r.dx.target  = dir * (1 + Math.random());
        r.dy.target  = dir * (1 + Math.random());
        r.rot.target = dir * (0.2 + Math.random() * 0.2);
        setTimeout(cycle, 20_000);
      };
      cycle();
    });

    /* 0 = top/left , 1 = top/right , 2 = bottom/left , 3 = bottom/right */
function drawTicksFor(r: Ruler, corner: 0 | 1 | 2 | 3) {
  const edges = [
    /* top-left   */ ['top', 'left'],
    /* top-right  */ ['top', 'right'],
    /* bottom-left*/ ['bottom', 'left'],
    /* bottom-right*/['bottom', 'right']
  ][corner];

  edges.forEach(edge => {
    if (edge === 'top') {
      for (let t = thick; t <= size - thick; t += tick) {
        ctx!.beginPath();
        ctx!.moveTo(t, 0);
        ctx!.lineTo(t, tickLen);
        ctx!.stroke();
      }
    }
    if (edge === 'left') {
      for (let t = thick; t <= size - thick; t += tick) {
        ctx!.beginPath();
        ctx!.moveTo(0, t);
        ctx!.lineTo(tickLen, t);
        ctx!.stroke();
      }
    }
    if (edge === 'bottom') {
      for (let t = thick; t <= size - thick; t += tick) {
        ctx!.beginPath();
        ctx!.moveTo(t, size);
        ctx!.lineTo(t, size - tickLen);
        ctx!.stroke();
      }
    }
    if (edge === 'right') {
      for (let t = thick; t <= size - thick; t += tick) {
        ctx!.beginPath();
        ctx!.moveTo(size, t);
        ctx!.lineTo(size - tickLen, t);
        ctx!.stroke();
      }
    }
  });
}

    const draw = () => {
        ctx!.clearRect(0, 0, w, h);
        ctx!.strokeStyle = 'hsla(210, 15%, 55%, 0.28)';
        ctx!.lineWidth = 0.75;

        rulers.forEach((r, idx) => {
            ctx!.save();
            ctx!.translate(r.x + r.dx.current, r.y + r.dy.current);
            ctx!.rotate(r.rot.current * Math.PI / 180);

            /* outer & inner squares */
            ctx!.strokeRect(0, 0, size, size);
            ctx!.strokeRect(thick, thick, size - 2 * thick, size - 2 * thick);

            /* choose tick sides based on corner index */
            drawTicksFor(r, idx as 0 | 1 | 2 | 3);

            ctx!.restore();
        });

        requestAnimationFrame(draw);
    };
    draw();

    return () => removeEventListener('resize', resize);
  });
</script>

<canvas
  bind:this={canvas}
  class="fixed inset-0 w-screen h-screen pointer-events-none -z-10"
></canvas>