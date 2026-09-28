import { Countdown } from "@/components/countdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Traveler } from "@/data/trips";
import type { FlightStatus } from "@/lib/tracking";
import { cn } from "@/lib/utils";

type Props = {
  traveler: Traveler;
  statuses: (FlightStatus | null)[]; // one per leg, same order
  className?: string;
};

const MIN_DELAY = 15; // minutes; smaller delays are noise

function StatusBadge({ status }: { status: FlightStatus }) {
  const { state, delayMinutes } = status;
  const notDepartedYet =
    state === "Scheduled" || state === "Boarding" || state === "Delayed";
  const delayed = notDepartedYet && delayMinutes >= MIN_DELAY;
  const label = delayed ? `Delayed ${delayMinutes}m` : state;

  const variant =
    delayed ||
    state === "Delayed" ||
    state === "Cancelled" ||
    state === "Diverted"
      ? "destructive"
      : state === "Landed"
        ? "default"
        : state === "Departed" || state === "In air"
          ? "secondary"
          : "outline";

  return <Badge variant={variant}>{label}</Badge>;
}

export function TripCard({ traveler, statuses, className }: Props) {
  // Best known times: live status when available, otherwise data/trips.ts.
  const times = traveler.legs.map((leg, i) => ({
    departure: statuses[i]?.departure ?? leg.departure,
    arrival: statuses[i]?.arrival ?? leg.arrival,
  }));

  return (
    <Card
      className={cn(
        "w-full max-w-md bg-card/75 shadow-xl backdrop-blur-md",
        className,
      )}
    >
      <CardHeader className="border-b pb-3 text-center">
        <CardTitle className="text-2xl">{traveler.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {traveler.legs.map((leg, i) => (
          <div
            key={leg.departure}
            className="space-y-2 not-last:border-b not-last:pb-4"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {leg.flight} · {leg.from} → {leg.to}
                </p>
                {statuses[i] && <StatusBadge status={statuses[i]} />}
              </div>
              {leg.operatedBy && (
                <p className="text-xs text-muted-foreground">
                  Operated by {leg.operatedBy}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2">
              <div className="pr-4">
                <p className="text-muted-foreground">Departure</p>
                <Countdown
                  target={times[i].departure}
                  doneLabel="Departed! ✈️"
                />
              </div>
              <div className="border-l pl-4">
                <p className="text-muted-foreground">Arrive</p>
                <Countdown target={times[i].arrival} doneLabel="Arrived! 🎉" />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 text-lg font-bold">
          <span>Arrived in Australia 🎉</span>
          <Countdown
            target={times[times.length - 1].arrival}
            doneLabel="Arrived to Australia 🎉"
          />
        </div>
      </CardContent>
    </Card>
  );
}
