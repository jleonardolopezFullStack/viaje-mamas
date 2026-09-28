export type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

export function getRemaining(targetIso: string, now: number): Remaining {
  const diff = Math.max(0, Date.parse(targetIso) - now);
  const total = Math.floor(diff / 1000);

  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: diff === 0,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

// "12d 04h 14m 09s"
export function formatRemaining({ days, hours, minutes, seconds }: Remaining): string {
  return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
