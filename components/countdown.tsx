"use client";

import { useSyncExternalStore } from "react";
import { formatRemaining, getRemaining } from "@/lib/countdown";

// Current time in whole seconds; null on the server so SSR shows the placeholder.
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
const getServerNow = () => null;

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
