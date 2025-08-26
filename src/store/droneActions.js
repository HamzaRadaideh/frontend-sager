import { DRONE_CONFIG } from '../utils/constants.js';
import { normalizeReg, canFly, shouldUpdatePoint, getDroneColor, headingFromHistory } from '../utils/droneUtils.js';
import { distMeters, bearingDeg, blendAngles } from '../utils/geomerty.js';

export function createUpsertAction(set, get) {
    return (f) => {
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

            const nextColor = getDroneColor(regNorm, p);
            let pointsDirty = false;
            let linesDirty = false;

            if (!existing) {
                map[id] = createNewDrone(id, regNorm, p, coord, now, nextColor);
                pointsDirty = true;
                linesDirty = true;
            } else {
                const updates = updateExistingDrone(existing, p, coord, now, nextColor);
                pointsDirty = updates.pointsDirty;
                linesDirty = updates.linesDirty;
            }

            return {
                drones: map,
                _pointsDirty: state._pointsDirty || pointsDirty,
                _linesDirty: state._linesDirty || linesDirty,
            };
        });
    };
}

function createNewDrone(id, regNorm, props, coord, now, color) {
    return {
        id,
        reg: regNorm,
        props: { ...props },
        history: [{
            coord: [coord[0], coord[1]],
            ts: now,
            ...(props.altitude != null ? { altitude: Number(props.altitude) } : {}),
        }],
        color,
        firstSeen: now,
        lastSeen: now,
        hdg: null,
    };
}

function updateExistingDrone(existing, props, coord, now, nextColor) {
    let pointsDirty = false;
    let linesDirty = false;

    // Merge props
    existing.props = { ...existing.props, ...props };

    // Update history if point is significant
    const hist = existing.history;
    const last = hist[hist.length - 1];
    const [lng, lat] = [coord[0], coord[1]];

    if (shouldUpdatePoint(last, [lng, lat], now)) {
        hist.push({
            coord: [lng, lat],
            ts: now,
            ...(props.altitude != null ? { altitude: Number(props.altitude) } : {}),
        });

        if (hist.length > DRONE_CONFIG.MAX_HISTORY) {
            hist.splice(0, hist.length - DRONE_CONFIG.MAX_HISTORY);
        }

        // Update smoothed heading if segment is long enough
        const segDist = last ? distMeters(last.coord, [lng, lat]) : 0;
        if (last && segDist >= DRONE_CONFIG.HDG_MIN_SEG_M) {
            const segHdg = bearingDeg(last.coord, [lng, lat]);
            existing.hdg = blendAngles(existing.hdg, segHdg, DRONE_CONFIG.HDG_ALPHA);
        }
        pointsDirty = true;

        if (canFly(existing.reg ?? existing.props?.registration ?? props.registration)) {
            linesDirty = true;
        }
    }

    // Update color if changed
    if (existing.color !== nextColor) {
        existing.color = nextColor;
        pointsDirty = true;
        linesDirty = true;
    }

    existing.lastSeen = now;

    return { pointsDirty, linesDirty };
}