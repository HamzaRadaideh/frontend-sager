import { create } from "zustand";

function canFly(reg) {
    // Green only if registration after the dash starts with 'B' (e.g., SD-B…)
    if (!reg) return false;
    const idx = reg.indexOf("-");
    const ch = idx >= 0 && reg[idx + 1] ? reg[idx + 1].toUpperCase() : "";
    return ch === "B";
}

export const useDroneStore = create((set, get) => ({
    drones: {},          // id -> { id, props, coords, color, firstSeen, lastSeen }
    selectedId: null,

    upsertFeature: (f) => {
        if (!f || f?.geometry?.type !== "Point") return;
        const p = f.properties || {};
        const id = `${p.serial || "UNKNOWN"}_${p.registration || "NA"}`;
        const coord = f.geometry.coordinates;

        set((state) => {
            const map = { ...state.drones };
            const existing = map[id];
            const now = Date.now();
            const color = canFly(p.registration) ? "#22c55e" : "#ef4444";

            if (!existing) {
                map[id] = {
                    id,
                    props: p,
                    coords: [coord],
                    color,
                    firstSeen: now,
                    lastSeen: now,
                };
            } else {
                existing.props = { ...existing.props, ...p };
                const arr = existing.coords;
                const last = arr[arr.length - 1];
                if (!last || last[0] !== coord[0] || last[1] !== coord[1]) {
                    arr.push(coord);
                    if (arr.length > 500) arr.shift(); // keep trail short
                }
                existing.color = color;
                existing.lastSeen = now;
            }
            return { drones: map };
        });
    },

    select: (id) => set({ selectedId: id }),
    clear: () => set({ drones: {}, selectedId: null }),

    getPoints: () => {
        const feats = [];
        const { drones } = get();
        Object.values(drones).forEach((d) => {
            const last = d.coords[d.coords.length - 1];
            feats.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: last },
                properties: { id: d.id, ...d.props, color: d.color, firstSeen: d.firstSeen },
            });
        });
        return { type: "FeatureCollection", features: feats };
    },

    getLines: () => {
        const feats = [];
        const { drones } = get();
        Object.values(drones).forEach((d) => {
            if (d.coords.length > 1) {
                feats.push({
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: d.coords },
                    properties: { id: d.id, color: d.color },
                });
            }
        });
        return { type: "FeatureCollection", features: feats };
    },

    redCount: () => {
        const { drones } = get();
        let c = 0;
        for (const d of Object.values(drones)) if (d.color === "#ef4444") c++;
        return c;
    },
}));
