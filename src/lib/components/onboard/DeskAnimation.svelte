<svelte:options runes={true} />

<script lang="ts">
  import { Spring } from 'svelte/motion';
  import { onMount } from 'svelte';

  let canvas = $state<HTMLCanvasElement>();
  let ctx    = $state<CanvasRenderingContext2D>();
  let dpr    = 1;
  let w = $state(0), h = $state(0);

  /* gentle drift */
  const dx = new Spring(0, { stiffness: 0.01, damping: 0.5 });
  const dy = new Spring(0, { stiffness: 0.01, damping: 0.5 });
  const rot = new Spring(0, { stiffness: 0.01, damping: 0.5 });

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
    };
    resize();
    addEventListener('resize', resize);

    let dir = 1;
    const cycle = () => {
      dir *= -1;
      dx.target = dir * 1.5;
      dy.target = dir * 1.5;
      rot.target = dir * 0.4;
      setTimeout(cycle, 20_000);
    };
    cycle();

    const draw = () => {
      ctx!.clearRect(0, 0, w, h);
      ctx!.strokeStyle = 'hsla(210, 15%, 60%, 0.30)';
      ctx!.lineWidth = 0.75;

      const drawL = (ox: number, oy: number, flip = false) => {
        ctx!.save();
        ctx!.translate(ox + dx.current, oy + dy.current);
        if (flip) ctx!.scale(-1, -1);
        ctx!.rotate(rot.current * Math.PI / 180);

        /* outer & inner rectangles */
        ctx!.strokeRect(0, 0, 120, 120);
        ctx!.strokeRect(20, 20, 80, 80);

        /* tick marks (every 10 px) */
        for (let t = 0; t <= 100; t += 10) {
          const y = t === 0 || t === 100 ? 0 : 4; // skip outer corners
          ctx!.beginPath();
          ctx!.moveTo(20 + t, 20 - y);
          ctx!.lineTo(20 + t, 20 - y - 4);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.moveTo(20 - y, 20 + t);
          ctx!.lineTo(20 - y - 4, 20 + t);
          ctx!.stroke();
        }
        ctx!.restore();
      };

      /* top-left ruler */
      drawL(20, 20);
      /* bottom-right ruler */
      drawL(w - 20, h - 20, true);

      requestAnimationFrame(draw);
    };
    draw();

    return () => removeEventListener('resize', resize);
  });
</script>

<canvas bind:this={canvas} class="ruler-bg" />

<style>
  .ruler-bg {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: -1;
  }
</style>