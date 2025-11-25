import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

// Reusable confetti trigger component. When `open` is true it will
// run a sequence of confetti bursts similar to GameResults.triggerConfetti.
// This component renders nothing to DOM and only manages the side-effect.
const ConfettiBurst = ({ open = false }) => {
  useEffect(() => {
    if (!open) return undefined;

    const count = 300;
    const defaults = {
      origin: { y: 0 },
      gravity: 0.7,
      drift: 0,
      ticks: 300,
      colors: [
        '#FF003F', '#39FF14', '#FF00FF', '#FFFF00', '#FFA500', '#00FFFF', '#FF6EC7', '#CCFF00', '#FF3131'
      ],
      shapes: ['square'],
      scalar: 1.2,
      disableForReducedMotion: true,
      useWorker: false
    };

    function shootConfettiFrom(xOrigin, options = {}) {
      confetti({
        ...defaults,
        particleCount: options.particleCount || Math.round(count / 5),
        spread: options.spread || 80,
        startVelocity: options.startVelocity || 40,
        origin: { x: xOrigin, y: options.y || 0 },
        scalar: options.scalar || defaults.scalar,
        angle: options.angle || 90,
        useWorker: false
      });
    }

    const timeouts = [];

    // Initial wide bursts
    for (let i = 0; i <= 10; i++) {
      timeouts.push(setTimeout(() => shootConfettiFrom(i / 10, { particleCount: count / 10, spread: 70 }), i * 50));
    }

    // First wave - steady rain
    for (let i = 0; i < 10; i++) {
      const timeout = setTimeout(() => {
        shootConfettiFrom(0.1 + (i % 5) * 0.2, {
          particleCount: 30,
          spread: 50
        });
      }, i * 400);
      timeouts.push(timeout);
    }

    // Second wave
    for (let i = 0; i < 8; i++) {
      const timeout = setTimeout(() => {
        shootConfettiFrom(0.2 + (i % 4) * 0.2, {
          particleCount: 25,
          startVelocity: 35
        });
      }, 1500 + (i * 600));
      timeouts.push(timeout);
    }

    // Final burst
    const finalTimeout = setTimeout(() => {
      for (let i = 0; i <= 5; i++) {
        shootConfettiFrom(i / 5, {
          particleCount: 40,
          spread: 60
        });
      }
    }, 6000);
    timeouts.push(finalTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, [open]);

  return null;
};

export default ConfettiBurst;
