'use client';
import { useEffect, useRef } from 'react';

const SPACING   = 32;
const BASE_R    = 1.5;
const MAX_R     = 4.5;
const INFLUENCE = 110;
const BASE_A    = 0.18;
const MAX_A     = 0.65;
const PUSH      = 12;   // max px dots shift away from cursor

export default function DotGrid() {
  const canvasRef = useRef(null);
  const mouse     = useRef({ x: -999, y: -999 });
  const raf       = useRef(null);

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

      for (let bx = SPACING / 2; bx < canvas.width + SPACING; bx += SPACING) {
        for (let by = SPACING / 2; by < canvas.height + SPACING; by += SPACING) {
          const dx   = bx - mx;
          const dy   = by - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const prox = Math.max(0, 1 - dist / INFLUENCE);

          // Push dots away from cursor
          const angle = Math.atan2(dy, dx);
          const shift = PUSH * prox;
          const x = bx + Math.cos(angle) * shift;
          const y = by + Math.sin(angle) * shift;

          const r     = BASE_R + (MAX_R - BASE_R) * prox;
          const alpha = BASE_A + (MAX_A - BASE_A) * prox;

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }

      raf.current = requestAnimationFrame(draw);
    }

    function onMouseMove(e) {
      mouse.current = { x: e.clientX, y: e.clientY };
    }

    function onMouseLeave() {
      mouse.current = { x: -999, y: -999 };
    }

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
