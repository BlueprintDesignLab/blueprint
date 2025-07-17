<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte';
  import { Spring } from 'svelte/motion';

  const pulse = new Spring(1, { stiffness: 0.05, damping: 0.35 });

  let canvas = $state<HTMLCanvasElement>();
  let ctx    = $state<CanvasRenderingContext2D>();
  let w      = $state(0);
  let h      = $state(0);

  /* ---------- layers (slower, more of them) ---------- */
  const layers = [
    { amp: 35,  freq: 0.010, speed: 0.016, hue: 180, alpha: 0.25 },
    { amp: 55,  freq: 0.015, speed: 0.014, hue: 180, alpha: 0.20 },
    { amp: 75,  freq: 0.008, speed: 0.012, hue: 180, alpha: 0.15 },
    { amp: 95,  freq: 0.020, speed: 0.010, hue: 180, alpha: 0.10 },
    { amp: 115, freq: 0.006, speed: 0.008, hue: 180, alpha: 0.10 },
    { amp: 140, freq: 0.004, speed: 0.006, hue: 180, alpha: 0.05 },
  ];

  let offsets      = layers.map(() => Math.random() * 1000);

  /* ---------- pulse trigger ---------- */
  function triggerPulse() {
    // pulse.set(1.3);
    // setTimeout(() => pulse.set(1), 400); // spring will tween back
  }

  onMount(() => {
    ctx = canvas!.getContext('2d')!;

    const resize = () => {
      w = canvas!.width  = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* click / key pulse */
    window.addEventListener('click', triggerPulse);
    window.addEventListener('keydown', triggerPulse);

    /* ---------- draw loop ---------- */
    const draw = () => {
      ctx!.clearRect(0, 0, w, h);
      layers.forEach((l, i) => {
        offsets[i] += l.speed;

        const amp = l.amp * pulse.current;
        ctx!.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = h / 2 + amp * Math.sin(x * l.freq + offsets[i]);
          ctx!.lineTo(x, y);
        }
        ctx!.lineTo(w, h);
        ctx!.lineTo(0, h);
        ctx!.closePath();

        const grad = ctx!.createLinearGradient(0, h / 2 - amp, 0, h / 2 + amp);
        grad.addColorStop(0, `hsla(${l.hue}, 70%, 85%, ${l.alpha})`);
        grad.addColorStop(1, `hsla(${l.hue}, 70%, 70%, ${l.alpha})`);
        ctx!.fillStyle = grad;
        ctx!.fill();
      });
      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', triggerPulse);
      window.removeEventListener('keydown', triggerPulse);
    };
  });
</script>

<canvas bind:this={canvas} class="tide" />

<style>
  .tide {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: #ffffff;
    z-index: -1;
  }
</style>