// Real flights. Dates are ISO 8601 with explicit offset, in the local time of each airport.
// Offsets in October 2026: BOG -05:00, SCL -03:00 (DST), CDG +02:00 (CEST, until 25 Oct),
// HKG +08:00, MIA -04:00 (EDT), LAX -07:00 (PDT), SYD +11:00 (AEDT).
// Values not given by the user are marked `// unconfirmed`.

export type Leg = {
  flight: string; // "LA575", "TBD" if not known yet
  airline: string; // marketing airline: "LATAM"
  operatedBy?: string; // only when another airline operates it: "Wamos Air"
  from: string; // origin IATA: "BOG"
  to: string; // destination IATA: "SCL"
  departure: string; // local time at origin
  arrival: string; // local time at destination
  trackAs?: string; // flight number to query in the tracking API when it differs (codeshare): "AA73"
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
        flight: "AF0435",
        airline: "Air France",
        trackAs: "AF435", // in case the tracking API rejects the leading zero
        from: "BOG",
        to: "CDG",
        departure: "2026-10-11T21:35:00-05:00",
        arrival: "2026-10-12T15:00:00+02:00",
      },
      {
        flight: "AF0188",
        airline: "Air France",
        trackAs: "AF188", // in case the tracking API rejects the leading zero
        from: "CDG",
        to: "HKG",
        departure: "2026-10-12T23:30:00+02:00",
        arrival: "2026-10-13T17:40:00+08:00",
      },
      {
        flight: "CX161",
        airline: "Cathay Pacific",
        from: "HKG",
        to: "SYD",
        departure: "2026-10-23T21:35:00+08:00",
        arrival: "2026-10-24T09:40:00+11:00",
      },
    ],
  },
  {
    name: "Maria Cruz",
    legs: [
      {
        flight: "AA1130",
        airline: "American Airlines",
        from: "BOG",
        to: "MIA",
        departure: "2026-10-26T06:40:00-05:00",
        arrival: "2026-10-26T11:46:00-04:00", // unconfirmed: 4h06 block time (airportia/flightera)
      },
      {
        flight: "AA1115",
        airline: "American Airlines",
        from: "MIA",
        to: "LAX",
        departure: "2026-10-26T13:45:00-04:00",
        arrival: "2026-10-26T16:15:00-07:00", // unconfirmed: ~5h30, typical MIA-LAX block time (flightsfrom); no published AA1115 arrival found
      },
      {
        flight: "QF4112",
        airline: "Qantas",
        operatedBy: "American Airlines", // unconfirmed: codeshare of AA73 (flightera/flyteam)
        trackAs: "AA73",
        from: "LAX",
        to: "SYD",
        departure: "2026-10-26T23:45:00-07:00",
        arrival: "2026-10-28T08:55:00+11:00", // unconfirmed: 15h10 block time of AA73 (flightera)
      },
    ],
  },
  {
    name: "Sonia Tovar",
    legs: [
      {
        flight: "LA575",
        airline: "LATAM",
        operatedBy: "Wamos Air",
        from: "BOG",
        to: "SCL",
        departure: "2026-10-22T06:35:00-05:00",
        arrival: "2026-10-22T14:35:00-03:00", // unconfirmed: 6h block time (airportia/flightstats)
      },
      {
        flight: "LA809",
        airline: "LATAM",
        from: "SCL",
        to: "SYD",
        departure: "2026-10-23T02:30:00-03:00",
        arrival: "2026-10-24T07:50:00+11:00",
      },
    ],
  },
];
