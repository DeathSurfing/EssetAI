"use client";

import { Suspense } from "react";
import HomeContent from "./HomeContent";

function HomeLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
