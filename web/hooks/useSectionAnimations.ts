"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

interface UseSectionAnimationsOptions {
  index: number;
  isEditing?: boolean;
}

export function useSectionAnimations({ index, isEditing = false }: UseSectionAnimationsOptions) {
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          delay: index * 0.1,
          ease: "power3.out",
        }
      );
    }
  }, [index]);

  // Hover animation handlers
  const handleMouseEnter = useCallback(() => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        x: 5,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        x: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, []);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  return {
    cardRef,
    textareaRef,
    handleMouseEnter,
    handleMouseLeave,
  };
}
