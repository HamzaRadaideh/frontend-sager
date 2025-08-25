// store/droneStore.js
import { create } from "zustand";
import { canFly, generateDroneId } from "../utils/droneUtils";
import { MAP_CONFIG } from "../lib/constants";

export const useDroneStore = create((set, get) => ({
    drones: {},
    selectedId: null,

    upsertFeature: (feature) => {
        if (!feature || feature?.geometry?.type !== "Point") return;

        const properties = feature.properties || {};
        // prefer stable id (from tracker or backend), else synthesize
        const id = properties.id || generateDroneId(properties.serial, properties.registration);
        const coord = feature.geometry.coordinates;

        set((state) => {
            const drones = { ...state.drones };
            const existing = drones[id];
            const now = Date.now();
            const color = canFly(properties.registration) ? "#22c55e" : "#ef4444";

            if (!existing) {
                drones[id] = {
                    id,
                    props: properties,
                    coords: [coord],
                    color,
                    firstSeen: now,
                    lastSeen: now,
                };
            } else {
                existing.props = { ...existing.props, ...properties };
                const coords = existing.coords;
                const lastCoord = coords[coords.length - 1];

                if (!lastCoord || lastCoord[0] !== coord[0] || lastCoord[1] !== coord[1]) {
                    coords.push(coord);
                    if (coords.length > (MAP_CONFIG.MAX_TRAIL_LENGTH ?? 500)) coords.shift();
                }

                existing.color = color;
                existing.lastSeen = now;
            }

            return { drones };
        });
    },

    select: (id) => set({ selectedId: id }),

    clearSelection: () => set({ selectedId: null }),

    clear: () => set({ drones: {}, selectedId: null }),

    // Get all drones as GeoJSON points
    getPoints: () => {
        const features = [];
        const { drones } = get();

        Object.values(drones).forEach((drone) => {
            const lastCoord = drone.coords[drone.coords.length - 1];
            features.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: lastCoord },
                properties: {
                    id: drone.id,
                    ...drone.props,
                    color: drone.color,
                    firstSeen: drone.firstSeen
                },
            });
        });

        return { type: "FeatureCollection", features };
    },

    // Get all drone paths as GeoJSON lines
    getLines: () => {
        const features = [];
        const { drones } = get();

        Object.values(drones).forEach((drone) => {
            if (drone.coords.length > 1) {
                features.push({
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: drone.coords },
                    properties: { id: drone.id, color: drone.color },
                });
            }
        });

        return { type: "FeatureCollection", features };
    },

    // Count red (unauthorized) drones
    redCount: () => {
        const { drones } = get();
        return Object.values(drones).filter(drone => drone.color === "#ef4444").length;
    },

    // Get drone by ID
    getDrone: (id) => {
        const { drones } = get();
        return drones[id];
    },

    // Get all drones as array
    getAllDrones: () => {
        const { drones } = get();
        return Object.values(drones);
    },
}));