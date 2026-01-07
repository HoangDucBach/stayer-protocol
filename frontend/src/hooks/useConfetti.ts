"use client";

import { useEffect, useRef } from "react";

type Shape = "rect" | "diamond" | "star";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: Shape;
}

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  ticks?: number;
  gravity?: number;
  scalar?: number;
  targetElement?: HTMLElement;
  offset?: number;
}

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fireworksParticlesRef = useRef<Particle[]>([]);
  const animationRunningRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "9999";
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      document.body.appendChild(canvas);
      canvasRef.current = canvas;

      // handle resize
      const handleResize = () => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    return () => {
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, []);

  // ------------------- CONFETTI -------------------
  const fire = (options: ConfettiOptions = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const {
      particleCount = 140,
      spread = 360,
      origin = { x: 0.5, y: 0.5 },
      colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
      ticks = 600,
      gravity = 0.55,
      scalar = 1.15,
    } = options;

    let originX = 0.5;
    let originY = 0.5;
    let x = canvas.width * origin.x;
    let y = canvas.height * origin.y;

    if (options.targetElement) {
      const rect = options.targetElement.getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height / 2) / window.innerHeight - (options.offset || 0.1);
      x = canvas.width * originX + (Math.random() - 0.5) * rect.width,
      y = canvas.height * originY + (Math.random() - 0.5) * rect.height;
    }

    const particles: Particle[] = [];
    const shapes: Shape[] = ["rect", "diamond", "star"];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * spread * Math.PI) / 180;
      const velocity = 4 + Math.random() * 8;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity * scalar,
        vy: Math.sin(angle) * velocity * scalar - 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: ticks,
        size: 10 + Math.random() * 10,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.18,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity * 0.06;
        p.vx *= 0.995;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const lifeRatio = p.life / ticks;
        ctx.globalAlpha = Math.min(1, lifeRatio * 1.6);
        ctx.fillStyle = p.color;
        // ctx.shadowBlur = 8;
        // ctx.shadowColor = p.color;

        switch (p.shape) {
          case "rect":
            drawRect(ctx, p.size);
            break;
          case "diamond":
            drawDiamond(ctx, p.size);
            break;
          case "star":
            drawStar(ctx, p.size);
            break;
        }
        ctx.restore();
      }

      if (particles.length > 0) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  // ------------------- FIREWORKS -------------------
  const launchFirework = (originX: number, originY: number, colors: string[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particleCount = 80;
    const shapes: Shape[] = ["rect", "rect", "diamond", "star"];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * 360 * Math.PI) / 180;
      const velocity = 4 + Math.random() * 6;
      fireworksParticlesRef.current.push({
        x: canvas.width * originX,
        y: canvas.height * originY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 300 + Math.random() * 100,
        size: 8 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
  };

  const animateFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = fireworksParticlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03; // gentle gravity
      p.vx *= 0.99; // air resistance
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.min(1, p.life / 300);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;

      switch (p.shape) {
        case "rect":
          drawRect(ctx, p.size);
          break;
        case "diamond":
          drawDiamond(ctx, p.size);
          break;
        case "star":
          drawStar(ctx, p.size);
          break;
      }
      ctx.restore();
    }


    if (particles.length > 0) {
      requestAnimationFrame(animateFireworks);
    } else {
      animationRunningRef.current = false;
    }
  };

  const fireworks = () => {
    const colors = ["#FFD700", "#FFA500", "#FF69B4", "#00CED1", "#9370DB", "#32CD32"];
    const fireCount = 5;

    for (let i = 0; i < fireCount; i++) {
      setTimeout(() => {
        launchFirework(Math.random(), Math.random() * 0.5, colors);
        if (!animationRunningRef.current) {
          animationRunningRef.current = true;
          animateFireworks();
        }
      }, i * 500);
    }
  };

  return { fire, fireworks };
}

// ------------------- DRAW SHAPES -------------------
function drawRect(ctx: CanvasRenderingContext2D, size: number) {
  ctx.fillRect(-size / 2, -size / 4, size, size / 2);
}

function drawDiamond(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(size / 2, 0);
  ctx.lineTo(0, size / 2);
  ctx.lineTo(-size / 2, 0);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  const spikes = 5;
  const outer = size / 2;
  const inner = outer / 2;
  let rot = (Math.PI / 2) * 3;
  let x = 0;
  let y = 0;

  ctx.beginPath();
  ctx.moveTo(0, -outer);
  for (let i = 0; i < spikes; i++) {
    x = Math.cos(rot) * outer;
    y = Math.sin(rot) * outer;
    ctx.lineTo(x, y);
    rot += Math.PI / spikes;

    x = Math.cos(rot) * inner;
    y = Math.sin(rot) * inner;
    ctx.lineTo(x, y);
    rot += Math.PI / spikes;
  }
  ctx.closePath();
  ctx.fill();
}
