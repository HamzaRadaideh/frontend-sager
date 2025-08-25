// store/droneStore.js
import { create } from "zustand";

/** =========================
 *  Config / constants
 *  ========================= */
const GREEN = "#22c55e";
const RED = "#ef4444";

// Keep history manageable
const MAX_HISTORY = 200;        // cap per drone
const MIN_TIME_MS = 500;        // ignore points that arrive too fast
const MIN_DIST_M = 5;          // ignore micro-movements (< ~5m)

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

    // Old rule: letters must be different, but allow BB as an explicit exception
    if (first !== "B" && first === second) return null;

    return up;
}

/**
 * Extract the first class letter after '-' without relying on normalizeReg,
 * so color logic works even when normalization rejects the format.
 * Accepts SB- or SD-, letters A-D; duplicates allowed here.
 */
function classLetter(reg) {
    const up = String(reg ?? "").trim().toUpperCase();
    const m = up.match(/^S[BD]-([ABCD])[ABCD]$/);
    return m ? m[1] : null;
}

// Only drones whose registration class is B are green.
function canFly(reg) {
    return classLetter(reg) === "B";
}

// Fast equirectangular distance (meters) good for small deltas
function distMeters([lng1, lat1], [lng2, lat2]) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000; // Earth radius (m)
    const x = toRad(lng2 - lng1) * Math.cos(toRad((lat1 + lat2) / 2));
    const y = toRad(lat2 - lat1);
    return Math.hypot(x, y) * R;
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
        // Stable id: prefer normalized reg; otherwise fall back to raw reg/serial
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
                    reg: regNorm,           // may be null if format rejected; color logic doesn't depend on this
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
                linesDirty = true; // safe to mark; first update will build an empty/line or a 1-pt path
            } else {
                // merge props
                existing.props = { ...existing.props, ...p };

                // add point only if moved enough or waited enough (thinning)
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
                    // cap history
                    if (hist.length > MAX_HISTORY) {
                        hist.splice(0, hist.length - MAX_HISTORY);
                    }
                    pointsDirty = true;
                    // Only draw lines for green drones (based on class letter, not normalization)
                    if (canFly(existing.reg ?? existing.props?.registration ?? p.registration)) {
                        linesDirty = true;
                    }
                }

                // handle color change (e.g., when class toggles), affects points + lines
                if (existing.color !== nextColor) {
                    existing.color = nextColor;
                    pointsDirty = true;
                    linesDirty = true; // green <-> red toggles inclusion in lines
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
            const last = d.history[d.history.length - 1];
            features.push({
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
            // Draw lines only for class B (green), regardless of duplicates like BB
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
