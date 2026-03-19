// Mapbox configuration
// Replace with your Mapbox access token or set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local
export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
  style: "mapbox://styles/mapbox/navigation-night-v1",
  defaultCenter: [15, 20] as [number, number],
  defaultZoom: 2.4,
  minZoom: 1.5,
  maxZoom: 8,
} as const;
