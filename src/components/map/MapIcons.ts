// components/map/MapIcons.tsx
import droneUrl from "../../assets/drone.svg";
import droneSvgRaw from "../../assets/drone.svg?raw";

async function getSvgText() {
    try {
        const res = await fetch(droneUrl);
        if (!res.ok) throw new Error(`fetch(${droneUrl}) -> ${res.status}`);
        const text = await res.text();
        if (text && text.includes("<svg")) return text;
    } catch (e) {
        console.warn("[drone.svg] fetch failed, falling back to ?raw:", e);
    }
    return droneSvgRaw;
}

function tintSvgWhite(svg: string, size = 96) {
    let out = svg;
    if (!/width="/i.test(out) && !/height="/i.test(out)) {
        out = out.replace(/<svg([^>]*?)>/i, `<svg$1 width="${size}" height="${size}">`);
    }
    out = out.replace(/<svg([^>]*)>/i, (m, attrs) => {
        const hasFill = /fill="/i.test(attrs);
        const hasStroke = /stroke="/i.test(attrs);
        const extra = `${hasFill ? "" : ` fill="#ffffff"`}${hasStroke ? "" : ` stroke="#ffffff"`}`;
        return `<svg${attrs}${extra}>`;
    });
    out = out
        .replace(/fill="(?!none)[^"]*"/gi, `fill="#ffffff"`)
        .replace(/stroke="(?!none)[^"]*"/gi, `stroke="#ffffff"`);
    return out;
}

export async function addCompositeIcon(
  map: mapboxgl.Map, name: string, circleColor: string, size = 88
) {
    const raw = await getSvgText();
    const whiteSvg = tintSvgWhite(raw, size);
    const blob = new Blob([whiteSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    
    const imgEl = new Image();
    await new Promise<void>((resolve, reject) => {
        imgEl.onload = () => resolve();
        imgEl.onerror = () => reject();
        imgEl.src = url;
    });

    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const canvas = document.createElement('canvas');
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    // Colored disc
    const R = size * 0.32;
    ctx.fillStyle = circleColor;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Outside wedge for heading
    const tipY = cy - R - size * 0.26;
    const baseY = cy - R - size * 0.02;
    const baseW = size * 0.18;
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - baseW / 2, baseY);
    ctx.lineTo(cx + baseW / 2, baseY);
    ctx.closePath();
    ctx.fill();

    // White drone glyph
    const DRONE_SIZE = size * 0.46;
    ctx.drawImage(imgEl, cx - DRONE_SIZE / 2, cy - DRONE_SIZE / 2, DRONE_SIZE, DRONE_SIZE);

    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL("image/png");
    await new Promise<void>((resolve, reject) => {
        map.loadImage(pngUrl, (err, image) => {
            if (err || !image) return reject(err || new Error("loadImage null"));
            if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: dpr });
            resolve();
        });
    });
}