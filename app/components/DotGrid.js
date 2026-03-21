'use client';
import { useEffect, useRef } from 'react';

const SPACING   = 28;                         // hex grid column spacing
const ROW_H     = SPACING * Math.sqrt(3) / 2; // hex row height
const BASE_R    = 1.4;
const MAX_R     = 5;
const INFLUENCE = 120;
const PUSH      = 14;

export default function DotGrid({ mode }) {
  const canvasRef = useRef(null);
  const mouse     = useRef({ x: -999, y: -999 });
  const raf       = useRef(null);
  const modeRef   = useRef(mode);

  // keep modeRef current without re-running the effect
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouse.current;
      const isLight = modeRef.current === 'light';

      // dot colors: light = medical blue tint, dark = teal-blue
      const baseColor  = isLight ? '59,130,246'  : '56,189,248';
      const BASE_A     = isLight ? 0.15 : 0.12;
      const MAX_A      = isLight ? 0.55 : 0.60;

      let row = 0;
      for (let by = ROW_H / 2; by < canvas.height + ROW_H; by += ROW_H, row++) {
        const offset = row % 2 === 0 ? 0 : SPACING / 2;
        for (let bx = offset + SPACING / 2; bx < canvas.width + SPACING; bx += SPACING) {
          const dx   = bx - mx;
          const dy   = by - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const prox = Math.max(0, 1 - dist / INFLUENCE);

          const angle = Math.atan2(dy, dx);
          const shift = PUSH * prox;
          const x = bx + Math.cos(angle) * shift;
          const y = by + Math.sin(angle) * shift;

          const r     = BASE_R + (MAX_R - BASE_R) * prox;
          const alpha = (BASE_A + (MAX_A - BASE_A) * prox).toFixed(2);

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${baseColor},${alpha})`;
          ctx.fill();
        }
      }

      raf.current = requestAnimationFrame(draw);
    }

    function onMouseMove(e) { mouse.current = { x: e.clientX, y: e.clientY }; }
    function onMouseLeave() { mouse.current = { x: -999, y: -999 }; }

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
