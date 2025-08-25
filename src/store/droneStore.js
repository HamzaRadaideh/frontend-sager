// store/droneStore.js
import { create } from "zustand";

/** =========================
 *  Config / constants
 *  ========================= */
const GREEN = "#22c55e";
const RED = "#ef4444";

// Keep history manageable
const MAX_HISTORY = 200;  // cap per drone
const MIN_TIME_MS = 500;  // ignore points that arrive too fast
const MIN_DIST_M = 5;    // ignore micro-movements (< ~5m)

/** =========================
 *  Helpers
 *  ========================= */

/**
 * Canonicalization for IDs, tolerant but still strict-ish:
 * - Accept prefixes SB- or SD-
 * - Accept classes A/B/C/D for both letters
 * - Keep the old "distinct letters" rule EXCEPT when first class is 'B'
 *   (so BB is allowed to normalize and stay stable)
 */
function normalizeReg(reg) {
    if (!reg) return null;
    const up = String(reg).trim().toUpperCase();
    if (!/^S[BD]-[ABCD]{2}$/.test(up)) return null;

    const first = up[3];
    const second = up[4];
    if (first !== "B" && first === second) return null; // keep BB as allowed
    return up;
}

function classLetter(reg) {
    const up = String(reg ?? "").trim().toUpperCase();
    const m = up.match(/^S[BD]-([ABCD])[ABCD]$/);
    return m ? m[1] : null;
}

function canFly(reg) {
    return classLetter(reg) === "B";
}

// Equirectangular distance (meters)
function distMeters([lng1, lat1], [lng2, lat2]) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000;
    const x = toRad(lng2 - lng1) * Math.cos(toRad((lat1 + lat2) / 2));
    const y = toRad(lat2 - lat1);
    return Math.hypot(x, y) * R;
}

// Bearing (degrees) p1 -> p2; 0=N, clockwise (Mapbox convention)
function bearingDeg([lng1, lat1], [lng2, lat2]) {
    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const λ1 = toRad(lng1), λ2 = toRad(lng2);
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Smooth heading from history:
 *  - look back up to the last 3 *distinct* segments
 *  - weight by segment length so long hops dominate
 */
function headingFromHistory(hist) {
    if (!hist || hist.length < 2) return null;

    let count = 0;
    let vx = 0, vy = 0;
    // scan backwards, collect up to 3 good segments
    for (let i = hist.length - 1; i > 0 && count < 3; i--) {
        const a = hist[i - 1].coord, b = hist[i].coord;
        if (a[0] === b[0] && a[1] === b[1]) continue; // identical point, skip
        const d = distMeters(a, b);
        if (d < 1) continue; // ignore tiny wiggles
        const br = bearingDeg(a, b) * Math.PI / 180;
        // weight by distance
        vx += Math.sin(br) * d;
        vy += Math.cos(br) * d;
        count++;
    }
    if (count === 0) return null;
    const hdg = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360; // back to deg, 0=N
    return hdg;
}

/** =========================
 *  Store
 *  ========================= */
export const useDroneStore = create((set, get) => ({
    // id -> { id, reg, props, history: [{coord:[lng,lat], ts, altitude?}], color, firstSeen, lastSeen }
    drones: {},
    selectedId: null,

    // GeoJSON caches + dirty flags (for performance)
    _pointsFC: null,
    _linesFC: null,
    _pointsDirty: true,
    _linesDirty: true,

    _markPointsDirty: () => set({ _pointsDirty: true }),
    _markLinesDirty: () => set({ _linesDirty: true }),

    upsertFeature: (f) => {
        if (!f || f?.geometry?.type !== "Point") return;

        const p = f.properties || {};
        const coord = f.geometry.coordinates;
        if (!Array.isArray(coord) || coord.length < 2) return;

        const regNorm = normalizeReg(p.registration);
        const id = regNorm ?? (p.registration ? String(p.registration).toUpperCase() : null) ?? p.serial ?? "UNKNOWN";
        const now = Date.now();

        set((state) => {
            const map = { ...state.drones };
            const existing = map[id];

            const nextColor = canFly(p.registration) ? GREEN : RED;
            let pointsDirty = false;
            let linesDirty = false;

            if (!existing) {
                map[id] = {
                    id,
                    reg: regNorm,
                    props: { ...p },
                    history: [{
                        coord: [coord[0], coord[1]],
                        ts: now,
                        ...(p.altitude != null ? { altitude: Number(p.altitude) } : {}),
                    }],
                    color: nextColor,
                    firstSeen: now,
                    lastSeen: now,
                };
                pointsDirty = true;
                linesDirty = true;
            } else {
                // merge props
                existing.props = { ...existing.props, ...p };

                // thinning
                const hist = existing.history;
                const last = hist[hist.length - 1];
                const [lng, lat] = [coord[0], coord[1]];

                const movedEnough = last ? distMeters(last.coord, [lng, lat]) >= MIN_DIST_M : true;
                const waitedEnough = last ? (now - last.ts) >= MIN_TIME_MS : true;
                const isNewPoint = !last || (movedEnough && waitedEnough);

                if (isNewPoint) {
                    hist.push({
                        coord: [lng, lat],
                        ts: now,
                        ...(p.altitude != null ? { altitude: Number(p.altitude) } : {}),
                    });
                    if (hist.length > MAX_HISTORY) {
                        hist.splice(0, hist.length - MAX_HISTORY);
                    }
                    pointsDirty = true;
                    if (canFly(existing.reg ?? existing.props?.registration ?? p.registration)) {
                        linesDirty = true;
                    }
                }

                if (existing.color !== nextColor) {
                    existing.color = nextColor;
                    pointsDirty = true;
                    linesDirty = true;
                }

                existing.lastSeen = now;
            }

            return {
                drones: map,
                _pointsDirty: state._pointsDirty || pointsDirty,
                _linesDirty: state._linesDirty || linesDirty,
            };
        });
    },

    select: (id) => set({ selectedId: id }),
    clear: () =>
        set({
            drones: {},
            selectedId: null,
            _pointsFC: null,
            _linesFC: null,
            _pointsDirty: true,
            _linesDirty: true,
        }),

    // Cached getters: recompute only when dirty
    getPoints: () => {
        const { drones, _pointsDirty, _pointsFC } = get();
        if (!_pointsDirty && _pointsFC) return _pointsFC;

        const features = [];
        for (const d of Object.values(drones)) {
            const hist = d.history;
            const last = hist[hist.length - 1];

            // robust heading from path (0..360, 0 = north)
            const hdg = headingFromHistory(hist);

            features.push({
                type: "Feature",
                geometry: { type: "Point", coordinates: last.coord },
                properties: {
                    id: d.id,
                    registration: d.reg ?? d.props?.registration ?? d.id,
                    color: d.color,
                    firstSeen: d.firstSeen,
                    lastSeen: d.lastSeen,
                    hdg,                // <— map uses this for rotation
                    ...d.props,         // keep server props (yaw/altitude/Name/etc.)
                },
            });
        }
        const fc = { type: "FeatureCollection", features };
        set({ _pointsFC: fc, _pointsDirty: false });
        return fc;
    },

    getLines: () => {
        const { drones, _linesDirty, _linesFC } = get();
        if (!_linesDirty && _linesFC) return _linesFC;

        const features = [];
        for (const d of Object.values(drones)) {
            const regForColor = d.reg ?? d.props?.registration;
            if (d.history.length > 1 && canFly(regForColor)) {
                features.push({
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: d.history.map((h) => h.coord) },
                    properties: {
                        id: d.id,
                        registration: d.reg ?? d.props?.registration ?? d.id,
                        color: d.color,
                    },
                });
            }
        }
        const fc = { type: "FeatureCollection", features };
        set({ _linesFC: fc, _linesDirty: false });
        return fc;
    },

    redCount: () => {
        const { drones } = get();
        let c = 0;
        for (const d of Object.values(drones)) if (d.color === RED) c++;
        return c;
    },
}));
