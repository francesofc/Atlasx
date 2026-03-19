"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_CONFIG } from "@/config/mapbox";
import type { CountryInfo } from "@/types";
import MapFallback from "./MapFallback";

interface MapViewProps {
  onCountryClick: (country: CountryInfo) => void;
  /** ISO3 → score (0–100) map for coloring countries */
  scoreMap?: Record<string, number>;
}

const COUNTRY_SOURCE = "country-boundaries";
const COUNTRY_SOURCE_LAYER = "country_boundaries";

/** Convert score 0–100 to an rgba color: red → amber → green
 *  DRAMATICALLY increased opacity for visual dominance on the map */
function scoreToColor(score: number): string {
  if (score >= 70) {
    // Green tier — emerald, strong presence
    const t = (score - 70) / 30;
    return `rgba(52, 211, 153, ${0.28 + t * 0.22})`;
  } else if (score >= 40) {
    // Orange tier — amber, warm presence
    const t = (score - 40) / 30;
    return `rgba(251, 191, 36, ${0.22 + t * 0.16})`;
  } else {
    // Red tier — clear warning
    const t = score / 40;
    return `rgba(248, 113, 113, ${0.18 + (1 - t) * 0.18})`;
  }
}

/** Score-aware hover color — tints toward score color instead of plain white */
function scoreToHoverColor(score: number): string {
  if (score >= 70) return "rgba(52, 211, 153, 0.22)";
  if (score >= 40) return "rgba(251, 191, 36, 0.20)";
  return "rgba(248, 113, 113, 0.20)";
}

export default function MapView({ onCountryClick, scoreMap }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const hoveredCountryId = useRef<string | number | null>(null);
  const [missingToken, setMissingToken] = useState(false);
  const layersReady = useRef(false);

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

  // Update fill colors when scoreMap changes
  useEffect(() => {
    if (!map.current || !layersReady.current || !scoreMap) return;

    const m = map.current;
    if (!m.getLayer("country-fill")) return;

    // Build match expression for fill color
    const matchExpr: (string | string[])[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const [iso, score] of Object.entries(scoreMap)) {
      (matchExpr as unknown[]).push(iso, scoreToColor(score));
    }
    (matchExpr as unknown[]).push("rgba(0, 0, 0, 0)"); // default — no score

    // Build match expression for hover color (score-aware)
    const hoverMatchExpr: (string | string[])[] = ["match", ["get", "iso_3166_1_alpha_3"]];
    for (const [iso, score] of Object.entries(scoreMap)) {
      (hoverMatchExpr as unknown[]).push(iso, scoreToHoverColor(score));
    }
    (hoverMatchExpr as unknown[]).push("rgba(255, 255, 255, 0.08)");

    m.setPaintProperty("country-fill", "fill-color", [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      [...hoverMatchExpr] as unknown as mapboxgl.Expression,
      ["boolean", ["feature-state", "clicked"], false],
      "rgba(255, 255, 255, 0.25)",
      ...(matchExpr as unknown as []),
    ] as unknown as mapboxgl.Expression);

    m.setPaintProperty("country-fill", "fill-opacity", 1);

    // Update score-aware glow layer for hover
    if (m.getLayer("country-score-glow")) {
      const glowMatchExpr: (string | string[])[] = ["match", ["get", "iso_3166_1_alpha_3"]];
      for (const [iso, score] of Object.entries(scoreMap)) {
        if (score >= 70) (glowMatchExpr as unknown[]).push(iso, "rgba(52, 211, 153, 0.35)");
        else if (score >= 40) (glowMatchExpr as unknown[]).push(iso, "rgba(251, 191, 36, 0.30)");
        else (glowMatchExpr as unknown[]).push(iso, "rgba(248, 113, 113, 0.30)");
      }
      (glowMatchExpr as unknown[]).push("rgba(255, 255, 255, 0.15)");

      m.setPaintProperty("country-score-glow", "line-color", [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        [...glowMatchExpr] as unknown as mapboxgl.Expression,
        "rgba(0, 0, 0, 0)",
      ] as unknown as mapboxgl.Expression);
    }

  }, [scoreMap]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

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

    mapInstance.scrollZoom.setWheelZoomRate(1 / 200);

    mapInstance.on("style.load", () => {
      // Premium atmospheric fog — deeper, richer, more spatial
      mapInstance.setFog({
        color: "rgb(6, 4, 16)",
        "high-color": "rgb(20, 10, 50)",
        "horizon-blend": 0.04,
        "space-color": "rgb(2, 2, 8)",
        "star-intensity": 0.7,
      });

      if (!mapInstance.getSource(COUNTRY_SOURCE)) {
        mapInstance.addSource(COUNTRY_SOURCE, {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        });
      }

      const addCountryLayers = () => {
        if (mapInstance.getLayer("country-fill")) return;

        const layers = mapInstance.getStyle().layers || [];
        let beforeLayerId: string | undefined;
        for (const layer of layers) {
          if (layer.type === "symbol") {
            beforeLayerId = layer.id;
            break;
          }
        }

        // Always-visible subtle country borders for depth and definition
        mapInstance.addLayer(
          {
            id: "country-border-subtle",
            type: "line",
            source: COUNTRY_SOURCE,
            "source-layer": COUNTRY_SOURCE_LAYER,
            paint: {
              "line-color": "rgba(255, 255, 255, 0.07)",
              "line-width": 0.6,
            },
          },
          beforeLayerId
        );

        // Country fill — primary visual layer
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
                "rgba(255, 255, 255, 0.15)",
                ["boolean", ["feature-state", "clicked"], false],
                "rgba(255, 255, 255, 0.25)",
                "rgba(0, 0, 0, 0)",
              ],
              "fill-opacity": 1,
              "fill-opacity-transition": { duration: 400 },
              "fill-color-transition": { duration: 600 },
            },
          },
          beforeLayerId
        );

        // Hover border — crisp inner line
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
                "rgba(255, 255, 255, 0.55)",
                ["boolean", ["feature-state", "clicked"], false],
                "rgba(255, 255, 255, 0.7)",
                "rgba(0, 0, 0, 0)",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                1.8,
                ["boolean", ["feature-state", "clicked"], false],
                2.5,
                0,
              ],
              "line-blur": 0.5,
              "line-width-transition": { duration: 200 },
              "line-color-transition": { duration: 200 },
            },
          },
          beforeLayerId
        );

        // Score-aware outer glow — soft halo around hovered country
        mapInstance.addLayer(
          {
            id: "country-score-glow",
            type: "line",
            source: COUNTRY_SOURCE,
            "source-layer": COUNTRY_SOURCE_LAYER,
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "rgba(255, 255, 255, 0.15)",
                "rgba(0, 0, 0, 0)",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                8,
                0,
              ],
              "line-blur": 6,
              "line-width-transition": { duration: 300 },
            },
          },
          beforeLayerId
        );

        // Click pulse glow — dramatic but brief
        mapInstance.addLayer(
          {
            id: "country-border-glow",
            type: "line",
            source: COUNTRY_SOURCE,
            "source-layer": COUNTRY_SOURCE_LAYER,
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "clicked"], false],
                "rgba(167, 139, 250, 0.25)",
                "rgba(0, 0, 0, 0)",
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "clicked"], false],
                12,
                0,
              ],
              "line-blur": 8,
              "line-width-transition": { duration: 400 },
            },
          },
          beforeLayerId
        );

        layersReady.current = true;
      };

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

    // Hover — smooth and responsive
    mapInstance.on("mousemove", "country-fill", (e) => {
      if (e.features && e.features.length > 0) {
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

    // Click with refined pulse
    mapInstance.on("click", "country-fill", (e) => {
      handleCountryClick(e);
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
        }, 800);
      }
    });

    mapInstance.dragRotate.disable();
    mapInstance.touchZoomRotate.disableRotation();
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
