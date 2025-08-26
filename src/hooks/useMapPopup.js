// hooks/useMapPopup.js
import { useRef } from 'react';
import mapboxgl from 'mapbox-gl';

export function useMapPopup() {
    const popupRef = useRef(null);

    const buildPopupHTML = (properties) => {
        const name = properties.Name || "Drone";
        const altVal = properties.altitude != null ? Number(properties.altitude) : null;
        const altStr = altVal != null && !Number.isNaN(altVal) ? `${altVal.toFixed(1)} m` : "–";
        const firstSeen = Number(properties.firstSeen || Date.now());
        const secs = (Date.now() - firstSeen) / 1000;

        const formatFlightTime = (secsTotal) => {
            const s = Math.max(0, Math.floor(secsTotal));
            const hh = String(Math.floor(s / 3600)).padStart(2, "0");
            const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
            const ss = String(s % 60).padStart(2, "0");
            return `${hh}:${mm}:${ss}`;
        };

        return `
      <div class="sager-popup-card">
        <div class="sager-popup-title">${name}</div>
        <div class="sager-popup-grid">
          <div>Altitude</div><div style="text-align:right">${altStr}</div>
          <div>Flight Time</div><div style="text-align:right">${formatFlightTime(secs)}</div>
        </div>
      </div>`;
    };

    const handleMove = (map) => (e) => {
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

        popupRef.current.setLngLat(e.lngLat).setHTML(buildPopupHTML(p)).addTo(map);
    };

    const handleEnter = (map) => () => {
        map.getCanvas().style.cursor = "pointer";
    };

    const handleLeave = (map) => () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
    };

    const cleanup = () => {
        popupRef.current?.remove();
    };

    return {
        handleMove,
        handleEnter,
        handleLeave,
        cleanup,
    };
}