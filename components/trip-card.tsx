import { Countdown } from "@/components/countdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Traveler } from "@/data/trips";
import { cn } from "@/lib/utils";

type Props = {
  traveler: Traveler;
  className?: string;
};

export function TripCard({ traveler, className }: Props) {
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
        {traveler.legs.map((leg) => (
          <div
            key={leg.departure}
            className="space-y-2 not-last:border-b not-last:pb-4"
          >
            <div>
              <p className="font-semibold">
                {leg.flight} · {leg.from} → {leg.to}
              </p>
              {leg.operatedBy && (
                <p className="text-xs text-muted-foreground">
                  Operated by {leg.operatedBy}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2">
              <div className="pr-4">
                <p className="text-muted-foreground">Departure</p>
                <Countdown target={leg.departure} doneLabel="Departed! ✈️" />
              </div>
              <div className="border-l pl-4">
                <p className="text-muted-foreground">Arrive</p>
                <Countdown target={leg.arrival} doneLabel="Arrived! 🎉" />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 text-lg font-bold">
          <span>Arrived to Australia 🎉</span>
          <Countdown
            target={traveler.legs[traveler.legs.length - 1].arrival}
            doneLabel="Arrived to Australia 🎉"
          />
        </div>
      </CardContent>
    </Card>
  );
}
