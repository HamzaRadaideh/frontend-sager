// lib/mapUtils.js
import { DRONE_ICONS, COLORS } from "./constants";

/**
 * Create and load arrow image for drone icons
 */
export function loadArrowImage(map, name, color) {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24">
      <path d="M12 2l5 7h-3v8h-4V9H7l5-7z" fill="${color}"/>
    </svg>
  `;

    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);

    return new Promise((resolve, reject) => {
        map.loadImage(url, (error, image) => {
            if (error) {
                reject(error);
            } else if (!map.hasImage(name)) {
                map.addImage(name, image);
                resolve(image);
            } else {
                resolve(image);
            }
        });
    });
}

/**
 * Setup drone layers on the map
 */
export function setupDroneLayers(map, getPoints, getLines) {
    // Add data sources
    map.addSource("drones", {
        type: "geojson",
        data: getPoints()
    });

    map.addSource("tracks", {
        type: "geojson",
        data: getLines()
    });

    // Add tracks layer
    map.addLayer({
        id: "tracks",
        type: "line",
        source: "tracks",
        paint: {
            "line-width": ["case", ["==", ["get", "id"], ""], 4, 2],
            "line-color": ["coalesce", ["get", "color"], COLORS.AUTHORIZED],
            "line-opacity": 0.9,
        },
    });

    // Add drones layer
    map.addLayer({
        id: "drones",
        type: "symbol",
        source: "drones",
        layout: {
            "icon-image": [
                "case",
                ["==", ["get", "color"], COLORS.UNAUTHORIZED],
                DRONE_ICONS.ARROW_RED,
                DRONE_ICONS.ARROW_GREEN
            ],
            "icon-size": 0.7,
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
}

/**
 * Update layer styling for selected drone
 */
export function updateSelectedDrone(map, selectedId) {
    if (!map.getLayer("drones") || !map.getLayer("tracks")) return;

    map.setLayoutProperty("drones", "icon-size", [
        "case",
        ["==", ["get", "id"], selectedId || ""],
        0.9,
        0.7
    ]);

    map.setPaintProperty("tracks", "line-width", [
        "case",
        ["==", ["get", "id"], selectedId || ""],
        4,
        2
    ]);
}

/**
 * Fly to specific coordinates with animation
 */
export function flyToDrone(map, coordinates, zoom = 13) {
    if (!coordinates || !map) return;

    map.flyTo({
        center: coordinates,
        zoom: Math.max(zoom, map.getZoom()),
        speed: 1.6,
        curve: 1.42,
    });
}