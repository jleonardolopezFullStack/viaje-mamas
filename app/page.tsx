import fs from "node:fs";
import path from "node:path";
import { Collage } from "@/components/collage";
import { TripCard } from "@/components/trip-card";
import { travelers } from "@/data/trips";

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

export default function Home() {
  return (
    <main className="relative isolate flex min-h-screen flex-col items-center gap-10 overflow-x-hidden px-4 py-10 md:py-16">
      <Collage images={getCollageImages()} />

      <h1 className="text-5xl font-bold tracking-tight md:text-7xl">Trip Time</h1>

      <div className="grid w-full max-w-4xl items-start justify-items-center gap-6 md:grid-cols-2 md:gap-12">
        {travelers.map((traveler, i) => (
          <TripCard
            key={traveler.name}
            traveler={traveler}
            className={`${tilts[i % tilts.length]} ${i === 2 ? "md:col-span-2" : ""}`}
          />
        ))}
      </div>
    </main>
  );
}
