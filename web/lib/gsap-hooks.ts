"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Hook for fade-in animations on mount
export function useFadeIn<T extends HTMLElement>(delay: number = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay,
        ease: "power3.out",
      }
    );
  }, [delay]);

  return ref;
}

// Hook for staggered children animations
export function useStagger<T extends HTMLElement>(
  selector: string,
  staggerDelay: number = 0.1
) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const children = containerRef.current.querySelectorAll(selector);
    if (children.length === 0) return;

    gsap.fromTo(
      children,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        stagger: staggerDelay,
        ease: "power3.out",
      }
    );
  }, [selector, staggerDelay]);

  return containerRef;
}

// Hook for scroll-triggered animations
export function useScrollReveal<T extends HTMLElement>(
  triggerOffset: string = "top 80%"
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const animation = gsap.fromTo(
      ref.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: triggerOffset,
          toggleActions: "play none none reverse",
        },
      }
    );

    return () => {
      animation.kill();
    };
  }, [triggerOffset]);

  return ref;
}

// Hook for hover scale effect
export function useHoverScale<T extends HTMLElement>(scale: number = 1.02) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    const handleMouseEnter = () => {
      gsap.to(element, {
        scale,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [scale]);

  return ref;
}

// Function to animate sections appearing
export function animateSectionEntry(element: HTMLElement, delay: number = 0) {
  return gsap.fromTo(
    element,
    { opacity: 0, x: -30 },
    {
      opacity: 1,
      x: 0,
      duration: 0.5,
      delay,
      ease: "power3.out",
    }
  );
}

// Function to animate map embed appearing
export function animateMapEmbed(element: HTMLElement) {
  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.9, y: 20 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.7,
      ease: "back.out(1.7)",
    }
  );
}

// Function for button click animation
export function animateButtonClick(element: HTMLElement) {
  return gsap.to(element, {
    scale: 0.95,
    duration: 0.1,
    yoyo: true,
    repeat: 1,
    ease: "power2.inOut",
  });
}

// Function for text typing effect
export function animateTyping(
  element: HTMLElement,
  text: string,
  speed: number = 30
) {
  element.textContent = "";
  const chars = text.split("");
  
  return gsap.to(element, {
    duration: chars.length * (speed / 1000),
    ease: "none",
    onUpdate: function() {
      const progress = this.progress();
      const charIndex = Math.floor(progress * chars.length);
      element.textContent = chars.slice(0, charIndex).join("");
    },
  });
}

// Magnetic button effect
export function useMagneticButton<T extends HTMLElement>(strength: number = 0.3) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(element, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)",
      });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [strength]);

  return ref;
}
