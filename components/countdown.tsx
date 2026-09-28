"use client";

import { useSyncExternalStore } from "react";
import { formatRemaining, getRemaining } from "@/lib/countdown";

// Shared clock for every Countdown: one interval, cached value.
// getSnapshot must return the same value until the store changes, so it reads `now`
// instead of calling Date.now() (which can differ between React's repeated calls).
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(onTick: () => void) {
  listeners.add(onTick);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    listeners.delete(onTick);
    if (listeners.size === 0) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
const getNow = () => now;
const getServerNow = () => null; // SSR shows the placeholder

type Props = {
  target: string;
  doneLabel: string;
};

export function Countdown({ target, doneLabel }: Props) {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);

  if (now === null) return <span className="whitespace-nowrap tabular-nums">--d --h --m --s</span>;

  const remaining = getRemaining(target, now);
  return (
    <span className="whitespace-nowrap tabular-nums">
      {remaining.done ? doneLabel : formatRemaining(remaining)}
    </span>
  );
}
