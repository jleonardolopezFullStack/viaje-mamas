// Placeholder data — real flights will replace these later.
// Dates are ISO 8601 with explicit offset, in the local time of each city:
// Colombia -05:00, China +08:00, Australia (Sydney, Oct–Apr daylight saving) +11:00.

export type Leg = {
  destination: string;
  departure: string;
  arrival: string;
};

export type Traveler = {
  name: string;
  legs: Leg[]; // chronological order
};

export const travelers: Traveler[] = [
  {
    name: "Ana Rairan",
    legs: [
      {
        destination: "China",
        departure: "2026-11-10T22:30:00-05:00",
        arrival: "2026-11-12T06:15:00+08:00",
      },
      {
        destination: "Australia",
        departure: "2026-11-20T09:00:00+08:00",
        arrival: "2026-11-20T21:30:00+11:00",
      },
    ],
  },
  {
    name: "Maria Cruz",
    legs: [
      {
        destination: "Australia",
        departure: "2026-11-15T23:55:00-05:00",
        arrival: "2026-11-18T06:40:00+11:00",
      },
    ],
  },
  {
    name: "Sonia Tovar",
    legs: [
      {
        destination: "Australia",
        departure: "2026-12-01T21:10:00-05:00",
        arrival: "2026-12-04T05:50:00+11:00",
      },
    ],
  },
];
