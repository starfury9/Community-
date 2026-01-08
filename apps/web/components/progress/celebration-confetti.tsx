"use client";

import { useCallback, useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface UseConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
}

/**
 * Hook to trigger confetti animation
 */
export function useConfetti(options: UseConfettiOptions = {}) {
  const { 
    particleCount = 100, 
    spread = 70, 
    origin = { x: 0.5, y: 0.5 } 
  } = options;

  const fire = useCallback(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    // Fire confetti from multiple origins for a bigger effect
    confetti({
      particleCount,
      spread,
      origin,
      colors: ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"],
    });

    // Additional bursts for a more celebratory feel
    setTimeout(() => {
      confetti({
        particleCount: Math.floor(particleCount * 0.5),
        spread: spread * 1.2,
        origin: { x: origin.x - 0.2, y: origin.y },
      });
    }, 100);

    setTimeout(() => {
      confetti({
        particleCount: Math.floor(particleCount * 0.5),
        spread: spread * 1.2,
        origin: { x: origin.x + 0.2, y: origin.y },
      });
    }, 200);
  }, [particleCount, spread, origin]);

  return { fire };
}

/**
 * Component that automatically triggers confetti on mount
 */
export function CelebrationConfetti({
  trigger = false,
  onComplete,
}: {
  trigger?: boolean;
  onComplete?: () => void;
}) {
  const hasTriggered = useRef(false);
  const { fire } = useConfetti({
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.4 },
  });

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true;
      fire();

      // Call onComplete after animation
      if (onComplete) {
        setTimeout(onComplete, 3000);
      }
    }
  }, [trigger, fire, onComplete]);

  return null;
}

/**
 * Fire a big celebration burst
 */
export function fireCelebration() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    return;
  }

  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Random confetti from different origins
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

/**
 * Fire a course complete mega celebration
 */
export function fireMegaCelebration() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    return;
  }

  // School pride colors
  const colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

  // Cannon left
  confetti({
    particleCount: 200,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors,
  });

  // Cannon right
  confetti({
    particleCount: 200,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors,
  });

  // Center burst
  setTimeout(() => {
    confetti({
      particleCount: 300,
      startVelocity: 45,
      spread: 360,
      origin: { x: 0.5, y: 0.4 },
      colors,
    });
  }, 300);
}
