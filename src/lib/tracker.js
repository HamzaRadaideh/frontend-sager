let tracks = new Map();               // id -> { last:[lon,lat], lastSeen:number }
let nextId = 1;

const MAX_ASSIGN_DIST_M = 450;       // how far a point can jump in 1s and still be same drone
const MAX_IDLE_MS = 15000;           // GC tracks if unseen for this long

const toRad = (v) => (v * Math.PI) / 180;
function haversineMeters([lon1, lat1], [lon2, lat2]) {
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

function bearingDeg([lon1, lat1], [lon2, lat2]) {
    let deg = (Math.atan2(lon2 - lon1, lat2 - lat1) * 180) / Math.PI; // 0° = north
    if (deg < 0) deg += 360;
    return Math.round(deg);
}

export function assignTracks(features) {
    const now = Date.now();

    // GC old tracks
    for (const [id, t] of tracks) {
        if (now - t.lastSeen > MAX_IDLE_MS) tracks.delete(id);
    }

    const used = new Set();       // track ids used in this tick
    const out = [];

    for (const f of features || []) {
        const coord = f?.geometry?.coordinates;
        if (!coord) continue;

        // find nearest unused track
        let bestId = null;
        let bestDist = Infinity;
        for (const [id, t] of tracks) {
            if (used.has(id)) continue;
            const d = haversineMeters(t.last, coord);
            if (d < bestDist) { bestDist = d; bestId = id; }
        }

        if (bestId && bestDist <= MAX_ASSIGN_DIST_M) {
            // update existing track
            const t = tracks.get(bestId);
            const yaw = bearingDeg(t.last, coord);
            t.last = coord;
            t.lastSeen = now;
            used.add(bestId);
            f.properties = { ...f.properties, id: bestId, yaw };
        } else {
            // create new track
            const id = `TRK_${nextId++}`;
            tracks.set(id, { last: coord, lastSeen: now });
            used.add(id);
            f.properties = { ...f.properties, id }; // yaw will be computed next tick
        }

        out.push(f);
    }

    return out;
}