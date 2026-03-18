"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_CONFIG } from "@/config/mapbox";
import type { CountryInfo } from "@/types";
import MapFallback from "./MapFallback";

interface MapViewProps {
  onCountryClick: (country: CountryInfo) => void;
}

// Country boundaries source layer from Mapbox
const COUNTRY_SOURCE = "country-boundaries";
const COUNTRY_SOURCE_LAYER = "country_boundaries";

export default function MapView({ onCountryClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hoveredCountryId = useRef<string | number | null>(null);
  const [missingToken, setMissingToken] = useState(false);

  const handleCountryClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      if (!map.current) return;
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ["country-fill"],
      });
      if (features.length > 0) {
        const feature = features[0];
        const name = feature.properties?.name_en || feature.properties?.name || "Unknown";
        const iso = feature.properties?.iso_3166_1_alpha_3 || "";
        onCountryClick({ name, iso });
      }
    },
    [onCountryClick]
  );

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Guard: show fallback if no token is configured
    if (!MAPBOX_CONFIG.accessToken) {
      setMissingToken(true);
      return;
    }

    mapboxgl.accessToken = MAPBOX_CONFIG.accessToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center: MAPBOX_CONFIG.defaultCenter,
      zoom: MAPBOX_CONFIG.defaultZoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
      projection: "globe",
      antialias: true,
    });

    // Smooth scroll zoom
    mapInstance.scrollZoom.setWheelZoomRate(1 / 200);

    mapInstance.on("style.load", () => {
      // Atmosphere / fog for premium globe feel
      mapInstance.setFog({
        color: "rgb(10, 10, 15)",
        "high-color": "rgb(20, 20, 30)",
        "horizon-blend": 0.08,
        "space-color": "rgb(5, 5, 10)",
        "star-intensity": 0.4,
      });

      // Add country boundaries vector source (not included in dark-v11 by default)
      if (!mapInstance.getSource(COUNTRY_SOURCE)) {
        mapInstance.addSource(COUNTRY_SOURCE, {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        });
      }

      // Wait for the source to be loaded before adding layers
      const addCountryLayers = () => {
        // Prevent duplicate layers on HMR
        if (mapInstance.getLayer("country-fill")) return;

        // Find a suitable layer to insert below (first symbol layer)
        const layers = mapInstance.getStyle().layers || [];
        let beforeLayerId: string | undefined;
        for (const layer of layers) {
          if (layer.type === "symbol") {
            beforeLayerId = layer.id;
            break;
          }
        }

        // Country fill — transparent by default, rich violet/blue glow on hover
        mapInstance.addLayer(
          {
            id: "country-fill",
            type: "fill",
            source: COUNTRY_SOURCE,
            "source-layer": COUNTRY_SOURCE_LAYER,
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "rgba(139, 92, 246, 0.12)",
                ["boolean", ["feature-state", "clicked"], false],
                "rgba(99, 102, 241, 0.18)",
                "rgba(0, 0, 0, 0)",
              ],
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                1,
                ["boolean", ["feature-state", "clicked"], false],
                1,
                0,
              ],
              "fill-opacity-transition": { duration: 300 },
              "fill-color-transition": { duration: 300 },
            },
          },
          beforeLayerId
        );

        // Inner glow border on hover — soft violet
        mapInstance.addLayer(
          {
            id: "country-border-hover",
            type: "line",
            source: COUNTRY_SOURCE,
            "source-layer": COUNTRY_SOURCE_LAYER,
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "rgba(139, 92, 246, 0.5)",
                ["boolean", ["feature-state", "clicked"], false],
                "rgba(99, 102, 241, 0.6)",
                "rgba(0, 0, 0, 0)",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                2,
                ["boolean", ["feature-state", "clicked"], false],
                2.5,
                0,
              ],
              "line-blur": 1.5,
              "line-width-transition": { duration: 300 },
              "line-color-transition": { duration: 300 },
            },
          },
          beforeLayerId
        );

        // Outer glow halo — wider, softer
        mapInstance.addLayer(
          {
            id: "country-border-glow",
            type: "line",
            source: COUNTRY_SOURCE,
            "source-layer": COUNTRY_SOURCE_LAYER,
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "rgba(139, 92, 246, 0.15)",
                "rgba(0, 0, 0, 0)",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                6,
                0,
              ],
              "line-blur": 4,
              "line-width-transition": { duration: 400 },
            },
          },
          beforeLayerId
        );
      };

      // Check if source is already loaded, otherwise wait for it
      if (mapInstance.isSourceLoaded(COUNTRY_SOURCE)) {
        addCountryLayers();
      } else {
        mapInstance.on("sourcedata", (e) => {
          if (e.sourceId === COUNTRY_SOURCE && e.isSourceLoaded) {
            addCountryLayers();
          }
        });
      }
    });

    // Hover interaction
    mapInstance.on("mousemove", "country-fill", (e) => {
      if (e.features && e.features.length > 0) {
        // Clear previous hover
        if (hoveredCountryId.current !== null) {
          mapInstance.setFeatureState(
            { source: COUNTRY_SOURCE, sourceLayer: COUNTRY_SOURCE_LAYER, id: hoveredCountryId.current },
            { hover: false }
          );
        }

        hoveredCountryId.current = e.features[0].id ?? null;

        if (hoveredCountryId.current !== null) {
          mapInstance.setFeatureState(
            { source: COUNTRY_SOURCE, sourceLayer: COUNTRY_SOURCE_LAYER, id: hoveredCountryId.current },
            { hover: true }
          );
        }

        mapInstance.getCanvas().style.cursor = "pointer";
      }
    });

    mapInstance.on("mouseleave", "country-fill", () => {
      if (hoveredCountryId.current !== null) {
        mapInstance.setFeatureState(
          { source: COUNTRY_SOURCE, sourceLayer: COUNTRY_SOURCE_LAYER, id: hoveredCountryId.current },
          { hover: false }
        );
      }
      hoveredCountryId.current = null;
      mapInstance.getCanvas().style.cursor = "";
    });

    // Click interaction — with pulse effect
    mapInstance.on("click", "country-fill", (e) => {
      // Fire the regular handler
      handleCountryClick(e);

      // Pulse effect: briefly set "clicked" state, clear after animation
      if (e.features && e.features.length > 0 && e.features[0].id != null) {
        const clickedId = e.features[0].id;
        mapInstance.setFeatureState(
          { source: COUNTRY_SOURCE, sourceLayer: COUNTRY_SOURCE_LAYER, id: clickedId },
          { clicked: true }
        );
        setTimeout(() => {
          try {
            mapInstance.setFeatureState(
              { source: COUNTRY_SOURCE, sourceLayer: COUNTRY_SOURCE_LAYER, id: clickedId },
              { clicked: false }
            );
          } catch { /* map may have been removed */ }
        }, 600);
      }
    });

    // Disable rotation for cleaner UX
    mapInstance.dragRotate.disable();
    mapInstance.touchZoomRotate.disableRotation();

    // Navigation controls — minimal
    mapInstance.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    map.current = mapInstance;

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [handleCountryClick]);

  // Show graceful fallback when token is missing
  if (missingToken) {
    return <MapFallback />;
  }

  return (
    <div
      ref={mapContainer}
      className="absolute inset-0 h-full w-full"
      aria-label="Interactive world map"
    />
  );
}
