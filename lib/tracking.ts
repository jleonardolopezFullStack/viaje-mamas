import type { Leg } from "@/data/trips";
import { getMockFlightStatus } from "@/lib/tracking-mock";

export type FlightState =
  | "Scheduled"
  | "Boarding"
  | "Departed"
  | "In air"
  | "Landed"
  | "Delayed"
  | "Cancelled"
  | "Diverted";

export type FlightStatus = {
  state: FlightState;
  departure: string; // ISO UTC, best known time (actual > revised > scheduled)
  arrival: string; // ISO UTC, best known time
  delayMinutes: number; // departure delay vs scheduled; 0 if on time
};

// AeroDataBox response (GET /flights/number/AA1130/2026-09-28), trimmed:
// [{
//   "departure": { "airport": { "iata": "BOG" },
//     "scheduledTime": { "utc": "2026-09-28 11:30Z" }, "revisedTime": { "utc": "2026-09-28 11:30Z" } },
//   "arrival": { "airport": { "iata": "MIA" },
//     "scheduledTime": { "utc": "2026-09-28 15:35Z" }, "revisedTime": { "utc": "2026-09-28 15:37Z" },
//     "predictedTime": { "utc": "2026-09-28 15:27Z" }, "runwayTime": { "utc": "2026-09-28 15:31Z" } },
//   "number": "AA 1130", "status": "Boarding", "codeshareStatus": "IsOperator"
// }]
type ApiTime = { utc: string };
type ApiMovement = {
  airport: { iata?: string };
  scheduledTime?: ApiTime;
  revisedTime?: ApiTime;
  predictedTime?: ApiTime;
  runwayTime?: ApiTime;
};
export type ApiFlight = {
  departure: ApiMovement;
  arrival: ApiMovement;
  status: string;
};

const API_HOST = "aerodatabox.p.rapidapi.com";
const HOUR = 3_600_000;
const WINDOW_BEFORE = 6 * HOUR;
const WINDOW_AFTER = 2 * HOUR;

const STATES: Record<string, FlightState> = {
  Expected: "Scheduled",
  CheckIn: "Scheduled",
  Boarding: "Boarding",
  GateClosed: "Boarding",
  Departed: "Departed",
  EnRoute: "In air",
  Approaching: "In air",
  Arrived: "Landed",
  Delayed: "Delayed",
  Canceled: "Cancelled",
  CanceledUncertain: "Cancelled",
  Diverted: "Diverted",
};

// "2026-09-28 11:30Z" → "2026-09-28T11:30Z"
const toIso = (t?: ApiTime) => t?.utc.replace(" ", "T");

export function inTrackingWindow(leg: Leg, now: number): boolean {
  return (
    now >= Date.parse(leg.departure) - WINDOW_BEFORE && now <= Date.parse(leg.arrival) + WINDOW_AFTER
  );
}

// Picks the flight matching the leg's route and maps it; null if missing or unknown status.
export function toFlightStatus(flights: ApiFlight[], leg: Leg): FlightStatus | null {
  const flight = flights.find(
    (f) => f.departure.airport.iata === leg.from && f.arrival.airport.iata === leg.to,
  );
  if (!flight) return null;

  const state = STATES[flight.status];
  if (!state) {
    console.error(`[tracking] ${leg.flight}: unknown status "${flight.status}"`);
    return null;
  }

  const dep = flight.departure;
  const arr = flight.arrival;
  const scheduledDep = toIso(dep.scheduledTime);
  const revisedDep = toIso(dep.revisedTime ?? dep.predictedTime);
  const delay =
    scheduledDep && revisedDep ? (Date.parse(revisedDep) - Date.parse(scheduledDep)) / 60_000 : 0;

  return {
    state,
    departure: toIso(dep.runwayTime ?? dep.revisedTime ?? dep.predictedTime ?? dep.scheduledTime) ?? leg.departure,
    arrival: toIso(arr.runwayTime ?? arr.revisedTime ?? arr.predictedTime ?? arr.scheduledTime) ?? leg.arrival,
    delayMinutes: Math.max(0, Math.round(delay)),
  };
}

// null = outside the tracking window, TBD, error or no data → the UI falls back to data/trips.ts.
export async function getFlightStatus(leg: Leg, now: number): Promise<FlightStatus | null> {
  if (process.env.TRACKING_MOCK === "true") return getMockFlightStatus(leg); // ignores the window
  if (leg.flight === "TBD" || !inTrackingWindow(leg, now)) return null;

  const key = process.env.AERODATABOX_API_KEY;
  if (!key) {
    console.error("[tracking] AERODATABOX_API_KEY is not set");
    return null;
  }

  const number = leg.trackAs ?? leg.flight;
  const date = leg.departure.slice(0, 10); // local departure date
  const url = `https://${API_HOST}/flights/number/${number}/${date}?dateLocalRole=Departure&withAircraftImage=false&withLocation=false`;

  try {
    const res = await fetch(url, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": API_HOST },
      next: { revalidate: 1800 }, // one API call per flight every 30 min at most
    });
    if (res.status === 204) return null; // no data for that flight/date
    if (!res.ok) {
      console.error(`[tracking] ${number} ${date}: HTTP ${res.status}`);
      return null;
    }
    return toFlightStatus((await res.json()) as ApiFlight[], leg);
  } catch (error) {
    console.error(`[tracking] ${number} ${date}:`, error);
    return null;
  }
}

// Statuses for all legs of a traveler, same order as `legs`.
export function getLegStatuses(legs: Leg[]): Promise<(FlightStatus | null)[]> {
  const now = Date.now();
  return Promise.all(legs.map((leg) => getFlightStatus(leg, now)));
}
