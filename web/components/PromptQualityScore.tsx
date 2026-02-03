"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PromptQualityScore, REQUIRED_SECTIONS } from "@/lib/prompt-quality";

interface PromptQualityScoreProps {
  score: PromptQualityScore | null;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            "w-4 h-4",
            star <= stars ? "text-primary fill-primary" : "text-muted-foreground"
          )}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function PromptQualityScoreDisplay({ score }: PromptQualityScoreProps) {
  if (!score) return null;
  
  return (
    <Card className="w-full p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Prompt Quality Score
          </h3>
          <p className="text-xs text-muted-foreground">
            Heuristic evaluation based on structure and clarity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StarRating stars={score.stars} />
          <div className="text-2xl font-bold text-primary">
            {score.percentage}%
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        {score.feedback.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <svg
              className="w-4 h-4 text-primary flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span>{item}</span>
          </div>
        ))}
      </div>
      
      {score.sectionsMissing.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Missing sections ({score.sectionsMissing.length}/{REQUIRED_SECTIONS.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {score.sectionsMissing.map((section) => (
              <span
                key={section}
                className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive whitespace-nowrap border border-destructive/20"
              >
                {section}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
