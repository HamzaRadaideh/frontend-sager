// components/map/MapLayers.js
import { MAP_CONFIG } from '../../utils/constants.js';

export function addMapLayers(map) {
    // Tracks layer
    map.addLayer({
        id: "tracks",
        type: "line",
        source: "tracks",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 4, 2],
            "line-color": ["coalesce", ["get", "color"], "#22c55e"],
            "line-opacity": 0.9,
        },
    });

    // Base drones layer
    map.addLayer({
        id: "drones",
        type: "symbol",
        source: "drones",
        layout: {
            "icon-image": [
                "case",
                ["==", ["get", "color"], "#ef4444"], "drone-composite-red", "drone-composite-green"
            ],
            "icon-size": 0.45,
            "icon-rotate": ["+", ["coalesce", ["get", "hdg"], 0], MAP_CONFIG.SVG_HEADING_OFFSET_DEG],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
            "text-field": ["get", "Name"],
            "text-size": 12,
            "text-offset": [0, 1.2],
            "text-anchor": "top",
        },
        paint: { "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1 },
    });

    // Selected overlay layer
    map.addLayer({
        id: "drones-selected",
        type: "symbol",
        source: "drones",
        filter: ["==", ["get", "id"], "__NONE__"],
        layout: {
            "icon-image": [
                "case",
                ["==", ["get", "color"], "#ef4444"], "drone-composite-red", "drone-composite-green"
            ],
            "icon-size": 0.65,
            "icon-rotate": ["+", ["coalesce", ["get", "hdg"], 0], MAP_CONFIG.SVG_HEADING_OFFSET_DEG],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true,
        },
    });
}