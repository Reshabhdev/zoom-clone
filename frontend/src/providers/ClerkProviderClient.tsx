"use client";
import { ClerkProvider } from "@clerk/nextjs";
import React from "react";

export default function ClerkProviderClient({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
