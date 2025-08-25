import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { io } from "socket.io-client";

const STYLE_URL = `https://api.maptiler.com/maps/darkmatter/style.json?key=${import.meta.env.VITE_MAP_KEY}`;
// (Stadia alternative) const STYLE_URL = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${import.meta.env.VITE_MAP_KEY}`;

export default function DroneMap() {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const drones = useRef({});          // id -> { props, coords: [[lon,lat],...], color }
  const needPush = useRef(false);

  // Small helper to add two colored drone icons
  function addDroneIcons(map) {
    const make = (name, color) => {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" fill="${color}"/>
          <rect x="1" y="11" width="7" height="2" rx="1" fill="${color}"/>
          <rect x="16" y="11" width="7" height="2" rx="1" fill="${color}"/>
          <rect x="11" y="1" width="2" height="7" rx="1" fill="${color}"/>
          <rect x="11" y="16" width="2" height="7" rx="1" fill="${color}"/>
        </svg>`;
      const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      map.loadImage(url, (err, img) => {
        if (!err && !map.hasImage(name)) map.addImage(name, img);
      });
    };
    make("drone-green", "#22c55e");
    make("drone-red", "#ef4444");
  }

  // Build GeoJSON snapshots from our in-memory store
  function buildGeoJSON() {
    const pointFeatures = [];
    const lineFeatures = [];
    for (const [id, d] of Object.entries(drones.current)) {
      const last = d.coords[d.coords.length - 1];
      pointFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: last },
        properties: { id, ...d.props, color: d.color, yaw: d.props?.yaw ?? 0 }
      });
      if (d.coords.length > 1) {
        lineFeatures.push({
          type: "Feature",
          geometry: { type: "LineString", coordinates: d.coords },
          properties: { id, color: d.color }
        });
      }
    }
    return {
      points: { type: "FeatureCollection", features: pointFeatures },
      lines:  { type: "FeatureCollection", features: lineFeatures }
    };
  }

  // Push latest data into the map sources
  function flushToMap() {
    if (!mapObj.current) return;
    const { points, lines } = buildGeoJSON();
    const srcPts = mapObj.current.getSource("drones");
    const srcLines = mapObj.current.getSource("tracks");
    if (srcPts) srcPts.setData(points);
    if (srcLines) srcLines.setData(lines);
  }

  useEffect(() => {
    // 1) Init map
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: STYLE_URL,
      center: [35.9313, 31.9488], // Amman (your generator already emits around here)
      zoom: 12,
      attributionControl: false
    });
    mapObj.current = map;

    map.on("load", () => {
      addDroneIcons(map);

      // Sources
      map.addSource("drones", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addSource("tracks", { type: "geojson", data: { type: "FeatureCollection", features: [] } });

      // Trails
      map.addLayer({
        id: "tracks",
        type: "line",
        source: "tracks",
        paint: {
          "line-width": 2,
          "line-opacity": 0.85,
          "line-color": ["coalesce", ["get", "color"], "#22c55e"]
        }
      });

      // Drone icons
      map.addLayer({
        id: "drones",
        type: "symbol",
        source: "drones",
        layout: {
          "icon-image": ["case",
            ["==", ["get", "color"], "#ef4444"], "drone-red",
            "drone-green"
          ],
          "icon-size": 0.7,
          "icon-rotate": ["get", "yaw"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "text-field": ["get", "Name"],
          "text-size": 12,
          "text-offset": [0, 1.4],
          "text-anchor": "top"
        },
        paint: { "text-color": "#fff", "text-halo-color": "#000", "text-halo-width": 1 }
      });

      // Popup on click
      map.on("click", "drones", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};
        const html = `
          <div style="font: 12px/1.4 sans-serif">
            <b>${p.Name || "Drone"}</b><br/>
            Serial: ${p.serial || "-"}<br/>
            Reg#: ${p.registration || "-"}<br/>
            Altitude: ${p.altitude ?? "-"} m<br/>
            Pilot: ${p.pilot || "-"}<br/>
            Org: ${p.organization || "-"}
          </div>`;
        new maplibregl.Popup({ closeButton: true })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });
    });

    // 2) Connect Socket.IO (same settings as your test)
    const socket = io("http://localhost:9013", {
      transports: ["polling"],
      path: "/socket.io",
      withCredentials: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("message", (payload) => {
      // payload: GeoJSON FeatureCollection with one Point
      const f = payload?.features?.[0];
      if (!f || f.geometry?.type !== "Point") return;

      const props = f.properties || {};
      const id = `${props.serial || "UNKNOWN"}_${props.registration || "NA"}`;
      const coord = f.geometry.coordinates; // [lon, lat]

      // Make a new bucket if needed
      if (!drones.current[id]) {
        // simple green/red based on yaw just for demo
        const color = (props.yaw ?? 0) % 2 === 0 ? "#22c55e" : "#ef4444";
        drones.current[id] = { props, coords: [], color };
      } else {
        // keep latest props (altitude/yaw/etc.)
        drones.current[id].props = props;
      }

      // append coordinate & cap trail length
      const arr = drones.current[id].coords;
      if (arr.length === 0 || (arr[arr.length - 1][0] !== coord[0] || arr[arr.length - 1][1] !== coord[1])) {
        arr.push(coord);
        if (arr.length > 300) arr.shift(); // keep last N points
      }

      // schedule a flush to the map
      if (!needPush.current) {
        needPush.current = true;
        requestAnimationFrame(() => {
          flushToMap();
          needPush.current = false;
        });
      }
    });

    return () => {
      socket.disconnect();
      map.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ height: "100vh", width: "100vw" }} />;
}
