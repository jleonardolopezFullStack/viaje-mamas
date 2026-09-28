import type { Leg } from "@/data/trips";
import type { FlightState, FlightStatus } from "@/lib/tracking";

// Fake statuses for TRACKING_MOCK=true: covers every UI state without spending API quota.
const MOCK: Record<string, { state: FlightState; delayMinutes: number }> = {
  LA575: { state: "Delayed", delayMinutes: 40 },
  LA809: { state: "In air", delayMinutes: 0 },
  CX161: { state: "Landed", delayMinutes: 0 },
  AA1130: { state: "Cancelled", delayMinutes: 0 },
};

const shift = (iso: string, minutes: number) =>
  new Date(Date.parse(iso) + minutes * 60_000).toISOString();

export function getMockFlightStatus(leg: Leg): FlightStatus | null {
  if (leg.flight === "TBD") return null;

  const { state, delayMinutes } = MOCK[leg.flight] ?? { state: "Scheduled", delayMinutes: 0 };
  return {
    state,
    departure: shift(leg.departure, delayMinutes),
    arrival: shift(leg.arrival, delayMinutes),
    delayMinutes,
  };
}
