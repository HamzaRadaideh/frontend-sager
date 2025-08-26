// utils/droneUtils.js
import { COLORS, DRONE_CONFIG } from './constants.js';
import { distMeters, bearingDeg } from './geomerty.js';

export function normalizeReg(reg) {
    if (!reg) return null;
    const up = String(reg).trim().toUpperCase();
    if (!/^S[BD]-[ABCD]{2}$/.test(up)) return null;

    const first = up[3];
    const second = up[4];
    if (first !== "B" && first === second) return null;
    return up;
}

export function classLetter(reg) {
    const up = String(reg ?? "").trim().toUpperCase();
    const m = up.match(/^S[BD]-([ABCD])[ABCD]$/);
    return m ? m[1] : null;
}

export function canFly(reg) {
    return classLetter(reg) === "B";
}

export function headingFromHistory(hist) {
    if (!hist || hist.length < 2) return null;

    let count = 0;
    let vx = 0, vy = 0;
    for (let i = hist.length - 1; i > 0 && count < 3; i--) {
        const a = hist[i - 1].coord, b = hist[i].coord;
        if (a[0] === b[0] && a[1] === b[1]) continue;
        const d = distMeters(a, b);
        if (d < 1) continue;
        const br = bearingDeg(a, b) * Math.PI / 180;
        vx += Math.sin(br) * d;
        vy += Math.cos(br) * d;
        count++;
    }
    if (count === 0) return null;
    const hdg = (Math.atan2(vx, vy) * 180 / Math.PI + 360) % 360;
    return hdg;
}

export function shouldUpdatePoint(lastPoint, newCoord, now) {
    if (!lastPoint) return true;

    const movedEnough = distMeters(lastPoint.coord, newCoord) >= DRONE_CONFIG.MIN_DIST_M;
    const waitedEnough = (now - lastPoint.ts) >= DRONE_CONFIG.MIN_TIME_MS;

    return movedEnough && waitedEnough;
}

export function getDroneColor(registration, props) {
    return canFly(registration || props?.registration) ? COLORS.GREEN : COLORS.RED;
}