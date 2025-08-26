// utils/geometry.js
export function distMeters([lng1, lat1], [lng2, lat2]) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371000;
    const x = toRad(lng2 - lng1) * Math.cos(toRad((lat1 + lat2) / 2));
    const y = toRad(lat2 - lat1);
    return Math.hypot(x, y) * R;
}

export function bearingDeg([lng1, lat1], [lng2, lat2]) {
    const toRad = (d) => (d * Math.PI) / 180;
    const toDeg = (r) => (r * 180) / Math.PI;
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const λ1 = toRad(lng1), λ2 = toRad(lng2);
    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function blendAngles(prevDeg, newDeg, alpha = 0.65) {
    if (prevDeg == null || Number.isNaN(prevDeg)) return newDeg;
    const pr = (prevDeg * Math.PI) / 180;
    const nr = (newDeg * Math.PI) / 180;
    const wPrev = 1 - alpha;
    const wNew = alpha;
    const vx = Math.sin(pr) * wPrev + Math.sin(nr) * wNew;
    const vy = Math.cos(pr) * wPrev + Math.cos(nr) * wNew;
    return (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;
}