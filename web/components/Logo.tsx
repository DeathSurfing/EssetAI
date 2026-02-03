"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/favicon.ico"
      alt="esset.ai"
      width={28}
      height={28}
      className={className}
      priority
    />
  );
}