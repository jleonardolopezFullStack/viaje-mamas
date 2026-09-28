"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_MS = 5 * 60 * 1000;

// Re-fetches the server-rendered page every 5 min without a full reload (client state is kept).
// The server caches each flight's API call for 30 min, so this does not spend extra quota.
export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
