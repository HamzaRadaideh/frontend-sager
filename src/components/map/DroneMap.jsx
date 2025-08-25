// components/map/DroneMap.jsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useDroneStore } from "../../store/droneStore";
import { MAP_CONFIG, DRONE_ICONS, COLORS } from "../../lib/constants";
import { createArrowSVG } from "../../utils/droneUtils";

export default function DroneMap() {
  const mapRef = useRef(null);
  const map = useRef(null);
  const popupRef = useRef(null);
  const pushing = useRef(false);

  const getPoints = useDroneStore((state) => state.getPoints);
  const getLines = useDroneStore((state) => state.getLines);
  const selectedId = useDroneStore((state) => state.selectedId);
  const select = useDroneStore((state) => state.select);

  // Initialize map
  useEffect(() => {
    const mapInstance = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_CONFIG.STYLE_URL,
      center: MAP_CONFIG.CENTER,
      zoom: MAP_CONFIG.ZOOM,
      attributionControl: false,
    });

    map.current = mapInstance;

    const loadArrowIcon = (name, color) => {
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(createArrowSVG(color));
      mapInstance.loadImage(url, (error, image) => {
        if (!error && !mapInstance.hasImage(name)) {
          mapInstance.addImage(name, image);
        }
      });
    };

    mapInstance.on("load", () => {
      // Load drone arrow icons
      loadArrowIcon(DRONE_ICONS.ARROW_GREEN, COLORS.AUTHORIZED);
      loadArrowIcon(DRONE_ICONS.ARROW_RED, COLORS.UNAUTHORIZED);

      // Add data sources
      mapInstance.addSource("drones", {
        type: "geojson",
        data: getPoints()
      });

      mapInstance.addSource("tracks", {
        type: "geojson",
        data: getLines()
      });

      // Add drone tracks layer
      mapInstance.addLayer({
        id: "tracks",
        type: "line",
        source: "tracks",
        paint: {
          "line-width": ["case", ["==", ["get", "id"], selectedId || ""], 4, 2],
          "line-color": ["coalesce", ["get", "color"], COLORS.AUTHORIZED],
          "line-opacity": 0.9,
        },
      });

      // Add drone points layer
      mapInstance.addLayer({
        id: "drones",
        type: "symbol",
        source: "drones",
        layout: {
          "icon-image": ["case",
            ["==", ["get", "color"], COLORS.UNAUTHORIZED], 
            DRONE_ICONS.ARROW_RED, 
            DRONE_ICONS.ARROW_GREEN
          ],
          "icon-size": ["case", ["==", ["get", "id"], selectedId || ""], 0.9, 0.7],
          "icon-rotate": ["get", "yaw"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "text-field": ["get", "Name"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#fff",
          "text-halo-color": "#000",
          "text-halo-width": 1
        },
      });

      // Hover popup functionality
      mapInstance.on("mousemove", "drones", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const properties = feature.properties || {};
        const firstSeen = Number(properties.firstSeen || Date.now());
        const seconds = Math.max(0, Math.floor((Date.now() - firstSeen) / 1000));
        const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
        const secs = String(seconds % 60).padStart(2, "0");

        const html = `
          <div style="font:12px/1.4 sans-serif">
            <b>${properties.Name || "Drone"}</b><br/>
            Altitude: ${properties.altitude ?? "-"} m<br/>
            Flight Time: ${minutes}:${secs}
          </div>
        `;

        if (!popupRef.current) {
          popupRef.current = new maplibregl.Popup({ 
            closeButton: false,
            closeOnClick: false
          });
        }

        popupRef.current.setLngLat(event.lngLat).setHTML(html).addTo(mapInstance);

      });

      mapInstance.on("mouseleave", "drones", () => {
        if (popupRef.current) {
          popupRef.current.remove();
        }
      });

      // Click handler for drone selection
      mapInstance.on("click", "drones", (event) => {
        const feature = event.features?.[0];
        if (!feature) return;

        const droneId = feature.properties?.id;
        if (droneId) {
          select(droneId);
        }
      });
    });

    // Subscribe to store changes and update map
    const unsubscribe = useDroneStore.subscribe(() => {
      if (pushing.current || !mapInstance.isStyleLoaded()) return;

      pushing.current = true;
      requestAnimationFrame(() => {
        const dronesSource = mapInstance.getSource("drones");
        const tracksSource = mapInstance.getSource("tracks");

        if (dronesSource) dronesSource.setData(getPoints());
        if (tracksSource) tracksSource.setData(getLines());

        pushing.current = false;
      });
    });

    return () => {
      unsubscribe();
      if (popupRef.current) popupRef.current.remove();
      mapInstance.remove();
    };
  }, [getPoints, getLines, select, selectedId]);

  // Handle selection changes - fly to selected drone
  useEffect(() => {
    if (!selectedId || !map.current) return;

    const dronesSource = map.current.getSource("drones");
    const data = dronesSource?._data;
    const selectedFeature = data?.features?.find(
      (feature) => feature?.properties?.id === selectedId
    );

    const coordinates = selectedFeature?.geometry?.coordinates;
    if (coordinates) {
      map.current.flyTo({
        center: coordinates,
        zoom: Math.max(13, map.current.getZoom()),
        speed: 1.6,
      });
    }

    // Update visual emphasis for selected drone
    if (map.current.getLayer("drones")) {
      map.current.setLayoutProperty("drones", "icon-size", [
        "case",
        ["==", ["get", "id"], selectedId],
        0.9,
        0.7
      ]);
    }

    if (map.current.getLayer("tracks")) {
      map.current.setPaintProperty("tracks", "line-width", [
        "case",
        ["==", ["get", "id"], selectedId],
        4,
        2
      ]);
    }
  }, [selectedId]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}