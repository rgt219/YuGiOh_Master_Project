import React, { useEffect, useRef } from 'react';

const CyberFlickersCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Auto-resize canvas to match viewport dimensions
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Dynamic particle density (scales automatically for Ultrawide / 4K displays)
    const particleCount = Math.floor(window.innerWidth / 20);
    const particles = [];

    class CyberParticle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        // Start randomly on screen initially, or spawn just below viewport
        this.y = initial ? Math.random() * canvas.height : canvas.height + Math.random() * 40;
        this.speedY = 0.8 + Math.random() * 2.2;  // Upward velocity
        this.length = 4 + Math.random() * 18;    // Vertical streak length
        this.width = 1 + Math.random() * 2;       // Streak width
        this.alpha = 0.1 + Math.random() * 0.7;  // Opacity
        this.flickerSpeed = 0.015 + Math.random() * 0.035;
        this.flickerDirection = Math.random() > 0.5 ? 1 : -1;
        
        // Master Duel Cyber Color Palette (Cyan, Neon Blue, Soft Electric Blue)
        const colors = ['#00f0ff', '#38bdf8', '#00a3ff', '#60a5fa', '#a5f3fc'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.y -= this.speedY; // Rise upwards

        // Subtle opacity flicker effect
        this.alpha += this.flickerSpeed * this.flickerDirection;
        if (this.alpha >= 0.85) this.flickerDirection = -1;
        if (this.alpha <= 0.15) this.flickerDirection = 1;

        // Respawn at bottom when particle reaches top of screen
        if (this.y < -this.length) {
          this.reset(false);
        }
      }

      draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;

        // Cyber Glow Effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;

        // Draw vertical rising flicker streak
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y - this.length);
        ctx.stroke();

        ctx.restore();
      }
    }

    // Spawn initial particle pool
    for (let i = 0; i < particleCount; i++) {
      particles.push(new CyberParticle());
    }

    // 60 FPS Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none', // Allows clicking through to app UI
        zIndex: 0,             // Sits behind content, above body background
      }}
    />
  );
};

export default CyberFlickersCanvas;