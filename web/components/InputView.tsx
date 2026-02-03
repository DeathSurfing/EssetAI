"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapEmbed } from "@/components/MapEmbed";
import { cn } from "@/lib/utils";

interface InputViewProps {
  googleMapsUrl: string;
  onUrlChange: (url: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function InputView({
  googleMapsUrl,
  onUrlChange,
  onGenerate,
  isLoading,
}: InputViewProps) {
  const hasUrl = googleMapsUrl.trim().length > 0;
  const isShortUrl = /(maps\.app\.goo\.gl|goo\.gl)/i.test(googleMapsUrl);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Website Prompt Generator
          </h1>
          <p className="text-muted-foreground">
            Enter a Google Maps business URL to generate a complete website brief
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="relative">
            <MapPin
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                hasUrl ? "text-primary" : "text-muted-foreground"
              )}
              size={20}
            />
            <Input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              disabled={isLoading}
              placeholder="Paste Google Maps business link here..."
              className={cn(
                "w-full h-14 pl-12 pr-4 text-base bg-background border-2 rounded-2xl",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all duration-300",
                hasUrl && "border-primary/50"
              )}
            />
          </div>

          {isShortUrl && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-yellow-600 dark:text-yellow-400 text-center"
            >
              Short URL detected. For better results, use the full Google Maps URL.
            </motion.p>
          )}
        </div>

        {/* WhatsApp-style Map Preview Card */}
        <motion.div
          initial={false}
          animate={{
            height: hasUrl ? "auto" : 0,
            opacity: hasUrl ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-sm font-medium">Location Preview</span>
            </div>

            {/* Map Container - WhatsApp style max-height */}
            <div className="relative w-full max-h-[400px] overflow-hidden">
              <div className="aspect-video w-full">
                <MapEmbed mapsUrl={googleMapsUrl} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: hasUrl ? 1 : 0.5 }}
          className="flex justify-center"
        >
          <Button
            onClick={onGenerate}
            disabled={!hasUrl || isLoading}
            size="lg"
            className={cn(
              "w-full max-w-md h-14 text-lg font-semibold rounded-xl",
              "bg-gradient-to-r from-primary via-primary/90 to-primary",
              "hover:from-primary/90 hover:via-primary hover:to-primary/80",
              "text-primary-foreground shadow-lg hover:shadow-xl",
              "transition-all duration-300 hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={20} />
                </motion.span>
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={20} />
                Generate Website Prompt
              </span>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
