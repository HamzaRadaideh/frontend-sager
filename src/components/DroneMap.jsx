import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDroneStore } from "../store/droneStore";
import { startSocket } from "../lib/socket";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Pick a Mapbox style; dark-v11 fits your theme
const STYLE_URL = "mapbox://styles/mapbox/dark-v11";

function makeArrowSVG(color) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24">
    <path d="M12 2l5 7h-3v8h-4V9H7l5-7z" fill="${color}"/>
  </svg>`;
}

export default function DroneMap() {
  const mapRef = useRef(null);
  const map = useRef(null);

  const getPoints = useDroneStore((s) => s.getPoints);
  const getLines  = useDroneStore((s) => s.getLines);
  const selectedId = useDroneStore((s) => s.selectedId);
  const select = useDroneStore((s) => s.select);

  const pushing = useRef(false);
  const popupRef = useRef(null);

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

    const loadArrow = (name, color) => {
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(makeArrowSVG(color));
      // loadImage + addImage still works in GL JS v3
      m.loadImage(url, (err, img) => {
        if (!err && img && !m.hasImage(name)) m.addImage(name, img);
      });
    };

    m.on("load", () => {
      loadArrow("arrow-green", "#22c55e");
      loadArrow("arrow-red",   "#ef4444");

      m.addSource("drones", { type: "geojson", data: getPoints() });
      m.addSource("tracks", { type: "geojson", data: getLines() });

      m.addLayer({
        id: "tracks",
        type: "line",
        source: "tracks",
        paint: {
          "line-width": ["case", ["==", ["get", "id"], selectedId || ""], 4, 2],
          "line-color": ["coalesce", ["get", "color"], "#22c55e"],
          "line-opacity": 0.9,
        },
      });

      m.addLayer({
        id: "drones",
        type: "symbol",
        source: "drones",
        layout: {
          "icon-image": ["case",
            ["==", ["get", "color"], "#ef4444"], "arrow-red", "arrow-green"
          ],
          "icon-size": ["case", ["==", ["get", "id"], selectedId || ""], 0.9, 0.7],
          "icon-rotate": ["get", "yaw"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "text-field": ["get", "Name"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1 },
      });

      // hover popup
      m.on("mousemove", "drones", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};
        const firstSeen = Number(p.firstSeen || Date.now());
        const secs = Math.max(0, Math.floor((Date.now() - firstSeen) / 1000));
        const mm = String(Math.floor(secs / 60)).padStart(2, "0");
        const ss = String(secs % 60).padStart(2, "0");
        const html = `
          <div style="font:12px/1.4 sans-serif">
            <b>${p.Name || "Drone"}</b><br/>
            Altitude: ${p.altitude ?? "-"} m<br/>
            Flight Time: ${mm}:${ss}
          </div>`;
        if (!popupRef.current) popupRef.current = new mapboxgl.Popup({ closeButton: false });
        popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(m);
      });
      m.on("mouseleave", "drones", () => popupRef.current?.remove());

      // click to select
      m.on("click", "drones", (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id;
        if (id) select(id);
      });
    });

    // push store changes to map at most once per frame
    const unsub = useDroneStore.subscribe(() => {
      if (pushing.current || !m.isStyleLoaded()) return;
      pushing.current = true;
      requestAnimationFrame(() => {
        m.getSource("drones")?.setData(getPoints());
        m.getSource("tracks")?.setData(getLines());
        pushing.current = false;
      });
    });

    return () => {
      unsub();
      popupRef.current?.remove();
      m.remove();
    };
  }, []);

  // emphasize selection
  useEffect(() => {
    if (!selectedId || !map.current) return;
    const fc = getPoints(); // safer than private _data
    const f = fc.features.find((ft) => ft?.properties?.id === selectedId);
    const coord = f?.geometry?.coordinates;
    if (coord) map.current.flyTo({ center: coord, zoom: Math.max(13, map.current.getZoom()), speed: 1.6 });

    map.current?.setLayoutProperty("drones", "icon-size", [
      "case", ["==", ["get", "id"], selectedId], 0.9, 0.7
    ]);
    map.current?.setPaintProperty("tracks", "line-width", [
      "case", ["==", ["get", "id"], selectedId], 4, 2
    ]);
  }, [selectedId]);

  return <div ref={mapRef} style={{ height: "100vh", width: "100%" }} />;
}
