import React, { useEffect, useRef } from 'react';
import { OmarchyTheme } from '../types';

interface HeroBackgroundAnimationProps {
  currentTheme: OmarchyTheme;
}

export const HeroBackgroundAnimation: React.FC<HeroBackgroundAnimationProps> = ({ currentTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);

    // Ephemeral container nodes drifting in space
    const particleCount = 38;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45 - 0.15, // slight upward drift like ephemeral containers
      size: Math.random() * 2.5 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    // Mouse parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let frame = 0;

    const render = () => {
      frame++;
      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle network links between close nodes (like docker container network mesh)
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.18;
            ctx.strokeStyle = currentTheme.primary;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around bounds
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Pulsing glow
        const currentAlpha = p.alpha + Math.sin(frame * p.pulseSpeed + p.pulseOffset) * 0.15;

        // Draw particle dot
        ctx.globalAlpha = Math.max(0.1, currentAlpha);
        ctx.fillStyle = i % 2 === 0 ? currentTheme.primary : currentTheme.accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle outer glow on larger particles
        if (p.size > 2) {
          ctx.globalAlpha = currentAlpha * 0.3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentTheme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Large Morphing Aurora Orbs */}
      <div
        className="absolute -top-32 left-1/4 w-[520px] h-[520px] rounded-full blur-[130px] opacity-25 animate-aurora-1"
        style={{
          background: `radial-gradient(circle, ${currentTheme.primary} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute top-10 right-1/6 w-[440px] h-[440px] rounded-full blur-[120px] opacity-20 animate-aurora-2"
        style={{
          background: `radial-gradient(circle, ${currentTheme.accent} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[140px] opacity-20 animate-aurora-3"
        style={{
          background: `radial-gradient(circle, ${currentTheme.secondary} 0%, transparent 70%)`,
        }}
      />

      {/* 2. Cyberpunk / Hyprland Perspective Grid with Horizon Fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-96 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${currentTheme.border} 1px, transparent 1px),
            linear-gradient(to bottom, ${currentTheme.border} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 90%)',
          transform: 'perspective(500px) rotateX(60deg) scale(1.6) translateY(20px)',
          transformOrigin: 'bottom center',
        }}
      />

      {/* 3. Glowing Horizon Scanline Beam */}
      <div
        className="absolute bottom-28 left-0 right-0 h-[2px] opacity-30 animate-pulse"
        style={{
          background: `linear-gradient(90deg, transparent, ${currentTheme.primary}, ${currentTheme.accent}, transparent)`,
          boxShadow: `0 0 20px ${currentTheme.accent}`,
        }}
      />

      {/* 4. Canvas for Connected Ephemeral Container Nodes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* 5. Floating Isometric Wireframe Cubes (Containers in Flight) */}
      <div className="absolute top-16 left-[10%] opacity-20 hidden md:block animate-float-slow">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <path d="M32 8 L54 20 L32 32 L10 20 Z" stroke={currentTheme.primary} strokeWidth="1.2" />
          <path d="M10 20 L10 44 L32 56 L32 32 Z" stroke={currentTheme.accent} strokeWidth="1.2" />
          <path d="M54 20 L54 44 L32 56 L32 32 Z" stroke={currentTheme.secondary} strokeWidth="1.2" />
        </svg>
      </div>

      <div className="absolute top-28 right-[12%] opacity-15 hidden md:block animate-float-reverse">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
          <path d="M32 8 L54 20 L32 32 L10 20 Z" stroke={currentTheme.accent} strokeWidth="1.2" />
          <path d="M10 20 L10 44 L32 56 L32 32 Z" stroke={currentTheme.primary} strokeWidth="1.2" />
          <path d="M54 20 L54 44 L32 56 L32 32 Z" stroke={currentTheme.primary} strokeWidth="1.2" />
        </svg>
      </div>

      <div className="absolute bottom-36 left-[16%] opacity-10 hidden lg:block animate-float-slow">
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
          <path d="M32 8 L54 20 L32 32 L10 20 Z" stroke={currentTheme.secondary} strokeWidth="1" />
          <path d="M10 20 L10 44 L32 56 L32 32 Z" stroke={currentTheme.primary} strokeWidth="1" />
          <path d="M54 20 L54 44 L32 56 L32 32 Z" stroke={currentTheme.accent} strokeWidth="1" />
        </svg>
      </div>

      {/* Keyframe Styles */}
      <style>{`
        @keyframes aurora1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(40px, 30px, 0) scale(1.12); }
        }
        @keyframes aurora2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-50px, -20px, 0) scale(1.18); }
        }
        @keyframes aurora3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(30px, -40px, 0) scale(1.08); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(4deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(14px) rotate(-5deg); }
        }
        .animate-aurora-1 {
          animation: aurora1 14s ease-in-out infinite alternate;
          will-change: transform;
        }
        .animate-aurora-2 {
          animation: aurora2 18s ease-in-out infinite alternate;
          will-change: transform;
        }
        .animate-aurora-3 {
          animation: aurora3 16s ease-in-out infinite alternate;
          will-change: transform;
        }
        .animate-float-slow {
          animation: floatSlow 8s ease-in-out infinite;
          will-change: transform;
        }
        .animate-float-reverse {
          animation: floatReverse 10s ease-in-out infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-aurora-1, .animate-aurora-2, .animate-aurora-3, .animate-float-slow, .animate-float-reverse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
