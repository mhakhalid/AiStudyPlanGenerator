"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";

type Props = { children: React.ReactNode };

export default function ConvexClerkProvider({ children }: Props) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!convexUrl) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  const client = new ConvexReactClient(convexUrl);

  return (
    <ClerkProvider>
      <ConvexProvider client={client}>{children}</ConvexProvider>
    </ClerkProvider>
  );
}
