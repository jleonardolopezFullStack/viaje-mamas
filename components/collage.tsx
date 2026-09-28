"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// One entry per figure: CSS shape + position/size.
// Mobile: bigger, peeking from the edges; md+: around the cards.
const shapes = [
  {
    shape: "shape-circle",
    position: "top-[1%] -left-[12%] size-[40vw] md:top-[4%] md:left-[3%] md:size-[22vw]",
  },
  {
    shape: "shape-blob",
    position: "top-[30%] -right-[15%] size-[45vw] md:top-[48%] md:right-auto md:-left-[2%] md:size-[26vw]",
  },
  {
    shape: "shape-hexagon",
    position: "top-[1%] -right-[10%] size-[35vw] md:top-[2%] md:right-[4%] md:size-[20vw]",
  },
  {
    shape: "shape-diamond",
    position: "top-[55%] -left-[15%] size-[45vw] md:top-[40%] md:left-auto md:-right-[1%] md:size-[24vw]",
  },
  {
    shape: "shape-rounded",
    position: "bottom-[12%] -right-[12%] size-[40vw] md:bottom-[3%] md:right-auto md:left-[24%] md:size-[16vw]",
  },
  {
    shape: "shape-star",
    position: "bottom-[1%] left-[5%] size-[35vw] md:bottom-[4%] md:left-auto md:right-[20%] md:size-[18vw]",
  },
];

// One figure changes per tick, so each figure changes every ~5s (6 × 833ms).
const TICK_MS = 833;

type Props = {
  images: string[];
};

export function Collage({ images }: Props) {
  // cycles[i] = how many times figure i has changed (k in the spec).
  const [cycles, setCycles] = useState(() => shapes.map(() => 0));

  useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let step = 0;
    const id = setInterval(() => {
      const figure = step++ % shapes.length;
      setCycles((c) => c.map((k, i) => (i === figure ? k + 1 : k)));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [images.length]);

  const imageAt = (i: number, k: number) => images[(i + k * shapes.length) % images.length];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-40 md:opacity-100">
      {shapes.map(({ shape, position }, i) => {
        const k = cycles[i];
        // Two stacked layers: the active one (k % 2) fades in, the other keeps the previous photo and fades out.
        const layers = [0, 1].map((slot) =>
          slot === k % 2 ? imageAt(i, k) : imageAt(i, k === 0 ? 1 : k - 1),
        );

        return (
          <div
            key={shape}
            className={`absolute overflow-hidden bg-linear-to-br from-sky-300 to-pink-300 ${shape} ${position}`}
          >
            {images.length > 0 &&
              layers.map((src, slot) => (
                <Image
                  key={slot}
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 45vw, 26vw"
                  className={`object-cover transition-opacity duration-1000 ${slot === k % 2 ? "opacity-100" : "opacity-0"}`}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
