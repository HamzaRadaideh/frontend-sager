// components/map/DroneMap.jsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useDroneStore } from "../../store/droneStore";
import { startSocket } from "../../lib/socket";
import { MAP_CONFIG } from "../../utils/constants";
import { useMapFollow } from "../../hooks/useMapFollow";
import { useMapPopup } from "../../hooks/useMapPopup";
import { addCompositeIcon } from "./MapIcons";
import { addMapLayers } from "./MapLayers";
import FloatingSideBar from "../sidebar/FloatingSideBar";
import GreenCounter from "../counters/GreenCounter";
import RedCounter from "../counters/RedCounter";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function DroneMap() {
  const mapRef = useRef(null);
  const map = useRef(null);
  const pushingRef = useRef(false);
  const lastPointsRef = useRef(null);
  const lastLinesRef = useRef(null);
  const lastSelectedRef = useRef(null);

  const getPoints = useDroneStore((s) => s.getPoints);
  const getLines = useDroneStore((s) => s.getLines);
  const selectedId = useDroneStore((s) => s.selectedId);
  const select = useDroneStore((s) => s.select);

  const { markUserAction, followDrone, flyToInitial } = useMapFollow();
  const { handleMove, handleEnter, handleLeave, cleanup } = useMapPopup();

  useEffect(() => {

    const m = new mapboxgl.Map({
      container: mapRef.current,
      style: MAP_CONFIG.STYLE_URL,
      center: [35.9313, 31.9488],
      zoom: 12,
      attributionControl: false,
    });
    map.current = m;

    m.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    // Add user interaction listeners
    m.on("dragstart", markUserAction);
    m.on("zoomstart", markUserAction);
    m.on("rotatestart", markUserAction);
    m.on("pitchstart", markUserAction);

    const reapplySelectedState = () => {
      const id = lastSelectedRef.current;
      if (!id) return;
      try { 
        m.setFeatureState({ source: "tracks", id }, { selected: true }); 
      } catch {}
    };

    m.on("load", async () => {
      await Promise.all([
        addCompositeIcon(m, "drone-composite-green", "#22c55e", 96),
        addCompositeIcon(m, "drone-composite-red", "#ef4444", 96),
      ]);

      m.addSource("drones", { type: "geojson", data: getPoints(), promoteId: "id" });
      m.addSource("tracks", { type: "geojson", data: getLines(), promoteId: "id" });

      addMapLayers(m);

      // Add popup handlers
      ["drones", "drones-selected"].forEach((layer) => {
        m.on("mouseenter", layer, handleEnter(m));
        m.on("mousemove", layer, handleMove(m));
        m.on("mouseleave", layer, handleLeave(m));
      });

      // Add click handler
      m.on("click", "drones", (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id;
        if (id) select(id);
      });

      reapplySelectedState();
    });

    // Store subscription for data updates
    const unsub = useDroneStore.subscribe(() => {
      const m = map.current;
      if (!m || !m.isStyleLoaded() || pushingRef.current) return;
      pushingRef.current = true;

      requestAnimationFrame(() => {
        const pts = getPoints();
        const lns = getLines();

        // Update sources if data changed
        if (lastPointsRef.current !== pts) {
          m.getSource("drones")?.setData(pts);
          lastPointsRef.current = pts;
        }
        if (lastLinesRef.current !== lns) {
          m.getSource("tracks")?.setData(lns);
          lastLinesRef.current = lns;
        }

        // Reapply selection state
        const id = lastSelectedRef.current;
        if (id) {
          try { m.setFeatureState({ source: "tracks", id }, { selected: true }); } catch {}
          try { m.setFilter("drones-selected", ["==", ["get", "id"], id]); } catch {}
        }

        // Follow selected drone
        followDrone(m, id, pts);
        pushingRef.current = false;
      });
    });

    const handleResize = () => m.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      unsub();
      window.removeEventListener("resize", handleResize);
      cleanup();
      m.remove();
    };
  }, []);

  // Handle selection changes
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

    // Fly to newly selected drone
    if (selectedId) {
      flyToInitial(m, selectedId, getPoints());
    }
  }, [selectedId, getPoints, flyToInitial]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />
      
      <div style={{ position: "absolute", top: 16, left: 16, zIndex: 5 }}>
        <FloatingSideBar />
      </div>

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
  )
}