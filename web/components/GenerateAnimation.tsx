"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface GenerateAnimationProps {
  isAnimating: boolean;
  businessName: string;
  onAnimationComplete: () => void;
  sections: string[];
}

export function GenerateAnimation({
  isAnimating,
  businessName,
  onAnimationComplete,
  sections,
}: GenerateAnimationProps) {
  const [phase, setPhase] = React.useState<"idle" | "compressing" | "ball" | "moving" | "streaming">("idle");

  React.useEffect(() => {
    if (isAnimating && phase === "idle") {
      // Start the animation sequence
      setPhase("compressing");
      
      // Phase 1: Compressing (800ms)
      setTimeout(() => {
        setPhase("ball");
      }, 800);
      
      // Phase 2: Hold as ball (400ms)
      setTimeout(() => {
        setPhase("moving");
      }, 1200);
      
      // Phase 3: Move to sidebar (1000ms)
      setTimeout(() => {
        setPhase("streaming");
      }, 2200);
      
      // Phase 4: Complete
      setTimeout(() => {
        onAnimationComplete();
        setPhase("idle");
      }, 2500);
    }
  }, [isAnimating, phase, onAnimationComplete]);

  if (!isAnimating || phase === "idle") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Phase 1 & 2: Cards compressing into ball */}
        {(phase === "compressing" || phase === "ball") && (
          <motion.div
            key="cards"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Background blur */}
            <motion.div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            />
            
            {/* Cards collapsing */}
            <div className="relative w-96 h-96">
              {sections.map((section, index) => {
                const angle = (index / sections.length) * 2 * Math.PI;
                const radius = phase === "compressing" ? 150 : 0;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <motion.div
                    key={index}
                    className="absolute top-1/2 left-1/2 w-32 h-20 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg flex items-center justify-center"
                    initial={{ 
                      x: x - 64, 
                      y: y - 40,
                      scale: 1,
                      opacity: 1,
                      rotate: 0,
                    }}
                    animate={{ 
                      x: phase === "compressing" ? x - 64 : -32,
                      y: phase === "compressing" ? y - 40 : -32,
                      scale: phase === "ball" ? 0 : 1,
                      opacity: phase === "ball" ? 0 : 1,
                      rotate: phase === "compressing" ? 360 : 0,
                    }}
                    transition={{ 
                      duration: phase === "compressing" ? 0.8 : 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    <span className="text-xs font-bold text-primary/80 text-center px-2">
                      {section}
                    </span>
                  </motion.div>
                );
              })}
              
              {/* Central energy ball */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: phase === "ball" ? 1 : 0.5,
                  opacity: phase === "ball" ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary via-primary/50 to-transparent animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
              </motion.div>
            </div>
            
            {/* Generating text */}
            <motion.div
              className="absolute bottom-1/3 left-1/2 -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 text-primary font-semibold text-lg">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={24} />
                </motion.span>
                esset.ai is crafting {businessName}...
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Phase 3: Ball moving to sidebar */}
        {phase === "moving" && (
          <motion.div
            key="ball-moving"
            className="absolute top-1/2 left-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2"
            initial={{ 
              x: 0, 
              y: 0,
              scale: 1,
            }}
            animate={{ 
              x: -window.innerWidth / 2 + 140,
              y: 100,
              scale: 0.5,
            }}
            transition={{ 
              duration: 0.8,
              ease: "easeInOut",
            }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary via-primary/50 to-transparent shadow-lg shadow-primary/50" />
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg" />
            
            {/* Trail effect */}
            <motion.div
              className="absolute top-1/2 left-1/2 w-full h-full"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <div className="w-full h-full rounded-full bg-primary/20" />
            </motion.div>
          </motion.div>
        )}
        
        {/* Phase 4: Streaming indicator */}
        {phase === "streaming" && (
          <motion.div
            key="streaming"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <motion.span
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={32} className="text-primary" />
                </motion.span>
              </motion.div>
              <p className="text-primary font-medium">Streaming sections...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
