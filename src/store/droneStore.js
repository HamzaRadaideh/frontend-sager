import { create } from "zustand";

// Validate & normalize: SG-[A-D]{2}, letters must be different (e.g., SG-AB, SG-BC)
function normalizeReg(reg) {
    if (!reg) return null;
    const up = String(reg).trim().toUpperCase();
    if (!/^SD-[A-D]{2}$/.test(up)) return null;
    if (up[3] === up[4]) return null; // distinct letters
    return up;
}

// Only drones whose registration starts with SG-B can fly (green)
function canFly(reg) {
    const n = normalizeReg(reg);
    const idx = n.indexOf("-");
    const ch = idx >= 0 && n[idx + 1] ? n[idx + 1].toUpperCase() : "";
    return ch === "B";
}

export const useDroneStore = create((set, get) => ({
    // id -> {
    //   id, reg, props, history: [{coord:[lng,lat], ts, altitude?}], color, firstSeen, lastSeen
    // }
    drones: {},
    selectedId: null,

    upsertFeature: (f) => {
        if (!f || f?.geometry?.type !== "Point") return;

        const p = f.properties || {};
        const coord = f.geometry.coordinates;
        if (!Array.isArray(coord) || coord.length < 2) return;

        const regNorm = normalizeReg(p.registration);
        const id = regNorm ?? (p.registration || p.serial || "UNKNOWN");
        const now = Date.now();

        set((state) => {
            const map = { ...state.drones };
            const existing = map[id];
            const color = canFly(p.registration) ? "#22c55e" : "#ef4444";

            if (!existing) {
                map[id] = {
                    id,
                    reg: regNorm,
                    props: { ...p },
                    history: [
                        {
                            coord: [coord[0], coord[1]],
                            ts: now,
                            ...(p.altitude != null ? { altitude: Number(p.altitude) } : {}),
                        },
                    ],
                    color,
                    firstSeen: now,
                    lastSeen: now,
                };
            } else {
                existing.props = { ...existing.props, ...p };
                const hist = existing.history;
                const last = hist[hist.length - 1];
                const [lng, lat] = [coord[0], coord[1]];
                const isNewPoint = !last || last.coord[0] !== lng || last.coord[1] !== lat;
                if (isNewPoint) {
                    hist.push({
                        coord: [lng, lat],
                        ts: now,
                        ...(p.altitude != null ? { altitude: Number(p.altitude) } : {}),
                    });
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
            const last = d.history[d.history.length - 1];
            feats.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: last.coord },
                properties: {
                    id: d.id,
                    registration: d.reg ?? d.props?.registration ?? d.id,
                    color: d.color,
                    firstSeen: d.firstSeen,
                    lastSeen: d.lastSeen,
                    ...d.props,
                },
            });
        });
        return { type: "FeatureCollection", features: feats };
    },

    getLines: () => {
        const feats = [];
        const { drones } = get();
        Object.values(drones).forEach((d) => {
            if (d.history.length > 1 && canFly(d.reg)) {
                feats.push({
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: d.history.map((h) => h.coord) },
                    properties: {
                        id: d.id,
                        registration: d.reg ?? d.props?.registration ?? d.id,
                        color: d.color,
                    },
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
