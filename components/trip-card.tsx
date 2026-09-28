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
    <Card className={cn("w-full max-w-md bg-card/75 shadow-xl backdrop-blur-md", className)}>
      <CardHeader className="border-b pb-3 text-center">
        <CardTitle className="text-2xl">{traveler.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2">
        <div className="space-y-3 pr-4">
          <p className="font-semibold">Departure</p>
          {traveler.legs.map((leg) => (
            <div key={leg.departure}>
              <p className="text-muted-foreground">{leg.destination}:</p>
              <Countdown target={leg.departure} doneLabel="Departed! ✈️" />
            </div>
          ))}
        </div>
        <div className="space-y-3 border-l pl-4">
          <p className="font-semibold">Arrive</p>
          {traveler.legs.map((leg) => (
            <div key={leg.arrival}>
              <p className="text-muted-foreground">{leg.destination}:</p>
              <Countdown target={leg.arrival} doneLabel="Arrived! 🎉" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
