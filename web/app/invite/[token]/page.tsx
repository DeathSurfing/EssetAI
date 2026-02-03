"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@workos-inc/authkit-nextjs/components";
import Link from "next/link";
import { toast } from "sonner";
import {
  Mail,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  UserPlus,
  AlertCircle,
  Loader2,
  Crown,
  LogIn,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

interface InviteDetails {
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: number;
  promptName: string;
  ownerName: string;
  email?: string;
}

type InviteState =
  | { type: "loading" }
  | { type: "not-found" }
  | { type: "expired" }
  | { type: "already-accepted" }
  | { type: "ready"; details: InviteDetails }
  | { type: "success"; promptId: string }
  | { type: "error"; message: string };

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [inviteState, setInviteState] = useState<InviteState>({ type: "loading" });
  const [isAccepting, setIsAccepting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  const token = params.token as string;

  // Fetch invite details
  const inviteDetails = useQuery(
    api.collaborationInvites.getInviteByToken,
    { inviteToken: token }
  );

  // Accept invite mutation
  const acceptInvite = useMutation(api.collaborationInvites.acceptInvite);

  // Determine invite state based on data
  useEffect(() => {
    if (inviteDetails === undefined) {
      setInviteState({ type: "loading" });
    } else if (inviteDetails === null) {
      setInviteState({ type: "not-found" });
    } else {
      const now = Date.now();
      const isExpired = now > inviteDetails.expiresAt;

      if (inviteDetails.status === "accepted") {
        setInviteState({ type: "already-accepted" });
      } else if (inviteDetails.status === "expired" || isExpired) {
        setInviteState({ type: "expired" });
      } else if (inviteDetails.status === "revoked") {
        setInviteState({ type: "error", message: "This invite has been revoked" });
      } else {
        setInviteState({ type: "ready", details: inviteDetails });
      }
    }
  }, [inviteDetails]);

  // Handle redirect countdown on success
  useEffect(() => {
    if (inviteState.type === "success" && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (inviteState.type === "success" && redirectCountdown === 0) {
      router.push(`/?prompt=${inviteState.promptId}`);
    }
  }, [inviteState, redirectCountdown, router]);

  const handleAcceptInvite = async () => {
    if (!user) return;

    setIsAccepting(true);
    try {
      const result = await acceptInvite({ inviteToken: token });
      
      if (result.success) {
        toast.success("You're now a collaborator!");
        setInviteState({ type: "success", promptId: result.promptId });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to accept invite";
      toast.error(errorMessage);
      setInviteState({ type: "error", message: errorMessage });
    } finally {
      setIsAccepting(false);
    }
  };

  const formatExpiryDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysRemaining = (expiresAt: number) => {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-semibold">esset.ai</span>
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Loading State */}
          {inviteState.type === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardContent className="pt-12 pb-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Loading invite details...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Not Found State */}
          {inviteState.type === "not-found" && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive/10 to-destructive/5 flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <CardTitle className="font-display text-xl">
                    Invite Not Found
                  </CardTitle>
                  <CardDescription>
                    This invite link doesn't exist or has been deleted
                  </CardDescription>
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
          )}

          {/* Expired State */}
          {inviteState.type === "expired" && (
            <motion.div
              key="expired"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/20 flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="font-display text-xl">
                    Invite Expired
                  </CardTitle>
                  <CardDescription>
                    This invite link has expired after 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      Please ask the prompt owner to generate a new invite link
                    </p>
                  </div>
                </CardContent>
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
          )}

          {/* Already Accepted State */}
          {inviteState.type === "already-accepted" && (
            <motion.div
              key="already-accepted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border/50 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="font-display text-xl">
                    Already Accepted
                  </CardTitle>
                  <CardDescription>
                    You've already accepted this invite
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      You can access this prompt from your dashboard
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-center pb-6 gap-3">
                  <Button asChild>
                    <Link href="/">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View Prompt
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Ready State - Show Invite Details */}
          {inviteState.type === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                <CardHeader className="text-center pb-4 pt-6">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
                    <UserPlus className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="font-display text-xl">
                    Collaboration Invite
                  </CardTitle>
                  <CardDescription>
                    You've been invited to collaborate on a prompt
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pb-4">
                  {/* Prompt Info */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Prompt
                        </p>
                        <p className="text-base font-medium truncate">
                          {inviteState.details.promptName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Owner Info */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                        <Crown className="w-5 h-5 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Invited by
                        </p>
                        <p className="text-base font-medium truncate">
                          {inviteState.details.ownerName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expiry Info */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Expires in {getDaysRemaining(inviteState.details.expiresAt)} days
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {formatExpiryDate(inviteState.details.expiresAt)}
                    </Badge>
                  </div>

                  {/* Email Restriction Notice */}
                  {inviteState.details.email && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                      <div className="flex items-start gap-2">
                        <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            This invite is for <strong>{inviteState.details.email}</strong>
                          </p>
                          {!user && (
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                              Please sign in with this email address
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pb-6">
                  {/* Not Authenticated - Show Sign In */}
                  {!user && (
                    <div className="w-full space-y-3">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          Sign in to accept this collaboration invite
                        </p>
                      </div>
                      <Button asChild className="w-full gap-2" size="lg">
                        <Link href={`/sign-in?redirect=${encodeURIComponent(`/invite/${token}`)}`}>
                          <LogIn className="w-4 h-4" />
                          Sign In to Accept
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Authenticated - Show Accept Button */}
                  {user && (
                    <div className="w-full space-y-3">
                      <Button
                        onClick={handleAcceptInvite}
                        disabled={isAccepting}
                        className="w-full gap-2"
                        size="lg"
                      >
                        {isAccepting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Accept Invite
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Signed in as <strong>{user.email}</strong>
                      </p>
                    </div>
                  )}


                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Success State */}
          {inviteState.type === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-emerald-200 dark:border-emerald-800/50 shadow-lg overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardHeader className="text-center pb-4 pt-6">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/20 flex items-center justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                  </div>
                  <CardTitle className="font-display text-xl text-emerald-700 dark:text-emerald-400">
                    Invite Accepted!
                  </CardTitle>
                  <CardDescription>
                    You're now a collaborator on this prompt
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-4">
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Collaboration Active</p>
                        <p className="text-xs text-muted-foreground">
                          You can now edit this prompt together in real-time
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Redirecting in <strong className="text-foreground">{redirectCountdown}</strong> seconds...
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="justify-center pb-6 gap-3">
                  <Button asChild variant="outline">
                    <Link href="/">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Go to Prompt
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {/* Error State */}
          {inviteState.type === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-destructive/20 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <CardTitle className="font-display text-xl">
                    Unable to Accept
                  </CardTitle>
                  <CardDescription>
                    {inviteState.message}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      {inviteState.message.includes("different email")
                        ? "Please sign in with the email address this invite was sent to"
                        : inviteState.message.includes("already a collaborator")
                        ? "You're already collaborating on this prompt"
                        : inviteState.message.includes("owner")
                        ? "You can't accept an invite to your own prompt"
                        : "Please contact the prompt owner for assistance"}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="justify-center pb-6 gap-3">
                  <Button asChild variant="outline">
                    <Link href="/">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Go Home
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          Powered by esset.ai
        </motion.p>
      </div>
    </div>
  );
}
