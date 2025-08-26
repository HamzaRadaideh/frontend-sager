// components/DroneMap.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDroneStore } from "../store/droneStore";
import { startSocket } from "../lib/socket";
import FloatingSideBar from "./FloatingSideBar";
import GreenCounter from "./GreenCounter";
import RedCounter from "./RedCounter";

// IMPORTANT: folder is "assets"
import droneUrl from "../assets/drone.svg";
import droneSvgRaw from "../assets/drone.svg?raw";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
const STYLE_URL = "mapbox://styles/mapbox/dark-v11";

// follow tuning
const FOLLOW_MIN_DIST_M = 8;
const USER_COOLDOWN_MS  = 1000;

// If your drone.svg points to the right, set this to 90 or -90.
const SVG_HEADING_OFFSET_DEG = 0;

// small equirectangular distance (meters)
function distMeters([lng1, lat1], [lng2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const x = toRad(lng2 - lng1) * Math.cos(toRad((lat1 + lat2) / 2));
  const y = toRad(lat2 - lat1);
  return Math.hypot(x, y) * R;
}

/* ---------- SVG fetch + make white ---------- */
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

function tintSvgWhite(svg, size = 96) {
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

/* ---------- Composite icon: colored circle + OUTSIDE wedge + white drone ---------- */
async function addCompositeIcon(map, name, circleColor, size = 88) {
  const raw = await getSvgText();
  const whiteSvg = tintSvgWhite(raw, size);
  const blob = new Blob([whiteSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const imgEl = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = url;
  });

  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const canvas = document.createElement("canvas");
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext("2d");
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

  // Outside wedge for heading (Mapbox rotates the whole sprite)
  const tipY  = cy - R - size * 0.26;
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
  await new Promise((resolve, reject) => {
    map.loadImage(pngUrl, (err, image) => {
      if (err || !image) return reject(err || new Error("loadImage null"));
      if (!map.hasImage(name)) map.addImage(name, image, { pixelRatio: dpr });
      resolve();
    });
  });
}

/* ----------------- Popup helpers ----------------- */
function fmtFlight(secsTotal) {
  const s = Math.max(0, Math.floor(secsTotal));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function buildPopupHTML(p) {
  const name = p.Name || "Drone";
  const altVal = p.altitude != null ? Number(p.altitude) : null;
  const altStr = altVal != null && !Number.isNaN(altVal) ? `${altVal.toFixed(1)} m` : "–";
  const firstSeen = Number(p.firstSeen || Date.now());
  const secs = (Date.now() - firstSeen) / 1000;

  return `
    <div class="sager-popup-card">
      <div class="sager-popup-title">${name}</div>
      <div class="sager-popup-grid">
        <div>Altitude</div><div style="text-align:right">${altStr}</div>
        <div>Flight Time</div><div style="text-align:right">${fmtFlight(secs)}</div>
      </div>
    </div>`;
}

/* ----------------- Component ----------------- */
export default function DroneMap() {
  const mapRef = useRef(null);
  const map = useRef(null);

  const getPoints  = useDroneStore((s) => s.getPoints);
  const getLines   = useDroneStore((s) => s.getLines);
  const selectedId = useDroneStore((s) => s.selectedId);
  const select     = useDroneStore((s) => s.select);

  // perf & state
  const pushingRef       = useRef(false);
  const popupRef         = useRef(null);
  const lastPointsRef    = useRef(null);
  const lastLinesRef     = useRef(null);
  const lastSelectedRef  = useRef(null);
  const lastFollowCoord  = useRef(null);
  const lastUserActionTs = useRef(0);

  useEffect(() => {
    startSocket();

    const m = new mapboxgl.Map({
      container: mapRef.current,
      style: STYLE_URL,
      center: [35.9313, 31.9488],
      zoom: 12,
      attributionControl: false,
    });
    map.current = m;

    m.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    const markUserAction = () => (lastUserActionTs.current = Date.now());
    m.on("dragstart", markUserAction);
    m.on("zoomstart", markUserAction);
    m.on("rotatestart", markUserAction);
    m.on("pitchstart", markUserAction);

    const reapplySelectedState = () => {
      const id = lastSelectedRef.current;
      if (!id) return;
      try { m.setFeatureState({ source: "tracks", id }, { selected: true }); } catch {}
    };

    // shared popup handlers for both layers
    const handleMove = (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties || {};
      if (!popupRef.current) {
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 8,
          className: "sager-popup",
        });
      }
      popupRef.current.setLngLat(e.lngLat).setHTML(buildPopupHTML(p)).addTo(m);
    };
    const handleEnter = () => (m.getCanvas().style.cursor = "pointer");
    const handleLeave = () => {
      m.getCanvas().style.cursor = "";
      popupRef.current?.remove();
    };

    m.on("load", async () => {
      await Promise.all([
        addCompositeIcon(m, "drone-composite-green", "#22c55e", 96),
        addCompositeIcon(m, "drone-composite-red",   "#ef4444", 96),
      ]);

      m.addSource("drones", { type: "geojson", data: getPoints(), promoteId: "id" });
      m.addSource("tracks", { type: "geojson", data: getLines(),  promoteId: "id" });

      m.addLayer({
        id: "tracks",
        type: "line",
        source: "tracks",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 4, 2],
          "line-color": ["coalesce", ["get", "color"], "#22c55e"],
          "line-opacity": 0.9,
        },
      });

      // Base drones
      m.addLayer({
        id: "drones",
        type: "symbol",
        source: "drones",
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "color"], "#ef4444"], "drone-composite-red", "drone-composite-green"
          ],
          "icon-size": 0.45,
          "icon-rotate": ["+", ["coalesce", ["get", "hdg"], 0], SVG_HEADING_OFFSET_DEG],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "text-field": ["get", "Name"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1 },
      });

      // Selected overlay
      m.addLayer({
        id: "drones-selected",
        type: "symbol",
        source: "drones",
        filter: ["==", ["get", "id"], "__NONE__"],
        layout: {
          "icon-image": [
            "case",
            ["==", ["get", "color"], "#ef4444"], "drone-composite-red", "drone-composite-green"
          ],
          "icon-size": 0.65,
          "icon-rotate": ["+", ["coalesce", ["get", "hdg"], 0], SVG_HEADING_OFFSET_DEG],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
        },
      });

      ["drones", "drones-selected"].forEach((layer) => {
        m.on("mouseenter", layer, handleEnter);
        m.on("mousemove",  layer, handleMove);
        m.on("mouseleave", layer, handleLeave);
      });

      m.on("click", "drones", (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id;
        if (id) select(id);
      });

      reapplySelectedState();
    });

    // subscription: setData + follow selected + keep filters
    const unsub = useDroneStore.subscribe(() => {
      const m = map.current;
      if (!m || !m.isStyleLoaded() || pushingRef.current) return;
      pushingRef.current = true;

      requestAnimationFrame(() => {
        const pts = getPoints();
        const lns = getLines();

        if (lastPointsRef.current !== pts) {
          m.getSource("drones")?.setData(pts);
          lastPointsRef.current = pts;
        }
        if (lastLinesRef.current !== lns) {
          m.getSource("tracks")?.setData(lns);
          lastLinesRef.current = lns;
        }

        const id = lastSelectedRef.current;
        if (id) {
          try { m.setFeatureState({ source: "tracks", id }, { selected: true }); } catch {}
          try { m.setFilter("drones-selected", ["==", ["get", "id"], id]); } catch {}
        }

        // follow selected
        if (id) {
          const feature = pts.features.find((ft) => ft?.properties?.id === id);
          const coord = feature?.geometry?.coordinates;
          const last  = lastFollowCoord.current;
          const userCoolingDown = Date.now() - lastUserActionTs.current < USER_COOLDOWN_MS;

          if (coord && !userCoolingDown) {
            if (!last || distMeters(last, coord) > FOLLOW_MIN_DIST_M) {
              m.easeTo({ center: coord, duration: 350 });
              lastFollowCoord.current = coord;
            }
          }
        }

        pushingRef.current = false;
      });
    });

    const handleResize = () => m.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      unsub();
      window.removeEventListener("resize", handleResize);
      popupRef.current?.remove();
      m.remove();
    };
  }, []);

  // selection change: update overlay filter + feature-state + initial fly
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    lastSelectedRef.current = selectedId ?? null;

    try {
      m.setFilter(
        "drones-selected",
        selectedId ? ["==", ["get", "id"], selectedId] : ["==", ["get", "id"], "__NONE__"]
      );
    } catch {}

    try {
      if (selectedId) m.setFeatureState({ source: "tracks", id: selectedId }, { selected: true });
    } catch {}

    if (!selectedId) return;

    const fc = getPoints();
    const f = fc.features.find((ft) => ft?.properties?.id === selectedId);
    const coord = f?.geometry?.coordinates;
    if (coord) {
      m.flyTo({ center: coord, zoom: Math.max(13, m.getZoom()), speed: 1.6 });
      lastFollowCoord.current = coord;
    }
  }, [selectedId, getPoints]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Map */}
      <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />

      {/* Floating card (top-left, over map) */}
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 5 }}>
        <FloatingSideBar />
      </div>

      {/* Counters (bottom-right, stacked) */}
      <div
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 6,
        }}
      >
        <GreenCounter />
        <RedCounter />
      </div>
    </div>
  );
}
