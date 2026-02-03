"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";

export default function SharedPromptPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shareToken = params.token as string;

  // Fetch the public prompt by share token
  const publicPrompt = useQuery(
    api.prompts.getPublicPrompt,
    shareToken ? { shareToken } : "skip"
  );

  useEffect(() => {
    if (publicPrompt === undefined) {
      // Still loading
      return;
    }

    if (publicPrompt === null) {
      setError("This shared prompt is not available or has been made private.");
      setIsLoading(false);
      return;
    }

    // Valid public prompt found - redirect to main app with the prompt ID
    // The main app will load it via the ?prompt= query parameter
    const promptId = publicPrompt._id;
    router.push(`/?prompt=${promptId}`);
  }, [publicPrompt, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <Card className="border-border/50 shadow-lg max-w-md w-full">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Loading shared prompt...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-destructive/20 shadow-lg max-w-md w-full">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="font-display text-xl">
                Prompt Not Available
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center pb-6">
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
}
