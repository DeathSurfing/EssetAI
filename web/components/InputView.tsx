"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { MapPin, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapEmbed } from "@/components/MapEmbed";
import { cn } from "@/lib/utils";
import { parseGoogleMapsUrl, parseGoogleMapsUrlSync } from "@/lib/location-parser";

interface InputViewProps {
  googleMapsUrl: string;
  onUrlChange: (url: string) => void;
  onGenerate: (parsedLocation?: any) => void;
  isLoading: boolean;
}

export function InputView({
  googleMapsUrl,
  onUrlChange,
  onGenerate,
  isLoading,
}: InputViewProps) {
  const [isExpanding, setIsExpanding] = React.useState(false);
  const [parsedLocation, setParsedLocation] = React.useState<any>(null);
  const [expansionError, setExpansionError] = React.useState<string | null>(null);
  
  const hasUrl = googleMapsUrl.trim().length > 0;
  const isShortUrl = /(maps\.app\.goo\.gl|goo\.gl)/i.test(googleMapsUrl);

  // Parse URL when it changes
  React.useEffect(() => {
    if (!hasUrl) {
      setParsedLocation(null);
      setExpansionError(null);
      return;
    }

    const parseUrl = async () => {
      if (isShortUrl) {
        setIsExpanding(true);
        setExpansionError(null);
      }

      try {
        const parsed = await parseGoogleMapsUrl(googleMapsUrl);
        setParsedLocation(parsed);
        if (parsed.expandedUrl && parsed.isExpanded) {
          setIsExpanding(false);
        }
      } catch (error) {
        setExpansionError(error instanceof Error ? error.message : 'Failed to parse URL');
        setIsExpanding(false);
        // Fallback to sync parsing
        const fallbackParsed = parseGoogleMapsUrlSync(googleMapsUrl);
        setParsedLocation(fallbackParsed);
      }
    };

    const timeoutId = setTimeout(parseUrl, 500); // Debounce parsing
    return () => clearTimeout(timeoutId);
  }, [googleMapsUrl, hasUrl, isShortUrl]);

  const handleGenerate = () => {
    onGenerate(parsedLocation);
  };

  const getStatusIcon = () => {
    if (isExpanding) {
      return <Loader2 size={14} className="animate-spin" />;
    }
    if (expansionError) {
      return <AlertCircle size={14} />;
    }
    if (parsedLocation?.isExpanded) {
      return <CheckCircle size={14} />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (isExpanding) {
      return "Expanding URL...";
    }
    if (expansionError) {
      return "Failed to expand URL";
    }
    if (parsedLocation?.isExpanded) {
      return "URL expanded successfully";
    }
    if (isShortUrl) {
      return "Short URL detected";
    }
    return null;
  };

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
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tight">
              esset.ai
            </h1>
            <p className="text-muted-foreground text-lg">
              Transform locations into stunning websites with AI
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
              disabled={isLoading || isExpanding}
              placeholder="Paste Google Maps business link here..."
              className={cn(
                "w-full h-14 pl-12 pr-4 text-base bg-background border-2 rounded-2xl",
                "focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all duration-300",
                hasUrl && "border-primary/50",
                isExpanding && "border-yellow-500"
              )}
            />
            {(isExpanding || expansionError || parsedLocation?.isExpanded) && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {getStatusIcon()}
              </div>
            )}
          </div>

          {/* URL Status Messages */}
          {(getStatusMessage() || parsedLocation) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-center space-y-2"
            >
              {getStatusMessage() && (
                <p className={cn(
                  expansionError ? "text-red-600 dark:text-red-400" :
                  isExpanding ? "text-yellow-600 dark:text-yellow-400 animate-pulse" :
                  parsedLocation?.isExpanded ? "text-green-600 dark:text-green-400" :
                  "text-gray-600 dark:text-gray-400"
                )}>
                  {getStatusMessage()}
                </p>
              )}
              
              {parsedLocation && (
                <div className="flex items-center justify-center gap-4 text-xs">
                  {parsedLocation.domainType !== 'unknown' && (
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {parsedLocation.domainType}
                    </span>
                  )}
                  {parsedLocation.extractionConfidence && (
                    <span className={cn(
                      "px-2 py-1 rounded-full",
                      parsedLocation.extractionConfidence === 'high' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      parsedLocation.extractionConfidence === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    )}>
                      {parsedLocation.extractionConfidence} confidence
                    </span>
                  )}
                </div>
              )}
            </motion.div>
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
                <MapEmbed mapsUrl={parsedLocation?.expandedUrl || googleMapsUrl} />
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
            onClick={handleGenerate}
            disabled={!hasUrl || isLoading || isExpanding}
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
            ) : isExpanding ? (
              <span className="flex items-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Expanding URL...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={20} />
                {parsedLocation?.isExpanded ? 'Generate (Expanded URL)' : 'Generate Website Prompt'}
              </span>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
