import fs from "node:fs";
import path from "node:path";
import { AutoRefresh } from "@/components/auto-refresh";
import { Collage } from "@/components/collage";
import { SkyBackground } from "@/components/sky-background";
import { TripCard } from "@/components/trip-card";
import { travelers } from "@/data/trips";
import { getLegStatuses } from "@/lib/tracking";

// Regenerate at most every 5 min; each flight's API call is cached 30 min (lib/tracking.ts).
export const revalidate = 300;

// Slight tilt per card on desktop, like the sketch.
const tilts = ["md:-rotate-2", "md:rotate-3", "md:-rotate-1"];

// Every image in public/collage/, sorted by name. Used by index, so any file name works.
function getCollageImages(): string[] {
  const dir = path.join(process.cwd(), "public", "collage");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => /\.(jpe?g|png|webp|avif)$/i.test(file))
    .sort()
    .map((file) => `/collage/${file}`);
}

export default async function Home() {
  // statuses[i][j] = live status of travelers[i].legs[j] (null → use data/trips.ts)
  const statuses = await Promise.all(
    travelers.map((traveler) => getLegStatuses(traveler.legs)),
  );

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center gap-10 overflow-x-hidden px-4 py-10 md:py-16">
      <AutoRefresh />
      <SkyBackground />
      <Collage images={getCollageImages()} />

      <h1 className="bg-linear-to-r from-sky-600 via-violet-600 to-rose-500 bg-clip-text pb-2 text-5xl font-bold tracking-tight text-transparent md:text-7xl dark:from-violet-300 dark:via-fuchsia-300 dark:to-sky-300">
        Trip Time
      </h1>

      <div className="grid w-full max-w-4xl items-start justify-items-center gap-6 md:grid-cols-2 md:gap-12">
        {travelers.map((traveler, i) => (
          <TripCard
            key={traveler.name}
            traveler={traveler}
            statuses={statuses[i]}
            className={`${tilts[i % tilts.length]} ${i === 2 ? "md:col-span-2" : ""}`}
          />
        ))}
      </div>
    </main>
  );
}
