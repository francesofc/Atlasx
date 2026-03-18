"use client";

import { useEffect, useRef, memo } from "react";

/**
 * Lightweight canvas-based particle field.
 * Renders ~40 tiny particles that drift upward slowly.
 * Uses requestAnimationFrame for 60fps performance.
 *
 * Tuning: adjust PARTICLE_COUNT, SPEED, MAX_OPACITY below.
 */

const PARTICLE_COUNT = 40;
const SPEED = 0.15;          // pixels per frame (very slow)
const MAX_OPACITY = 0.2;     // max particle opacity
const MIN_SIZE = 0.5;
const MAX_SIZE = 1.8;

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
}

function createParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: MIN_SIZE + Math.random() * (MAX_SIZE - MIN_SIZE),
    opacity: Math.random() * MAX_OPACITY,
    speed: SPEED + Math.random() * SPEED,
    drift: (Math.random() - 0.5) * 0.3,
  };
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Size to window (use devicePixelRatio for crisp rendering)
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    const w = window.innerWidth;
    const h = window.innerHeight;
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(w, h)
    );

    const animate = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;

      ctx.clearRect(0, 0, cw, ch);

      for (const p of particlesRef.current) {
        // Move
        p.y -= p.speed;
        p.x += p.drift;

        // Wrap
        if (p.y < -10) {
          p.y = ch + 10;
          p.x = Math.random() * cw;
        }
        if (p.x < -10) p.x = cw + 10;
        if (p.x > cw + 10) p.x = -10;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 140, 255, ${p.opacity})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      aria-hidden="true"
    />
  );
}

export default memo(ParticleField);
