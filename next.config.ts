import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The home page lists public/collage/ with fs at render time (revalidates every 5 min).
  // On Vercel, public/ is served from the CDN and is not bundled with the server function,
  // so include the photos in its trace or the collage would be empty after revalidation.
  outputFileTracingIncludes: {
    "/": ["./public/collage/**/*"],
  },
};

export default nextConfig;
