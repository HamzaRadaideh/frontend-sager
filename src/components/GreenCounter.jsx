// components/GreenCounter.jsx
import { useEffect, useState } from "react";
import { useDroneStore } from "../store/droneStore";

/**
 * Figma-style light pill with a dark circular badge.
 * Sits above RedCounter in the bottom-right of the map.
 * Label defaults to "Drone Flying".
 */
export default function GreenCounter({ label = "Drone Flying" }) {
  // initial count
  const initial = (() => {
    const drones = useDroneStore.getState().drones;
    return Object.values(drones).filter((d) => d.color === "#22c55e").length;
  })();
  const [val, setVal] = useState(initial);

  // keep in sync with the store
  useEffect(() => {
    const unsub = useDroneStore.subscribe((s) => {
      const c = Object.values(s.drones).filter((d) => d.color === "#22c55e").length;
      setVal(c);
    });
    return () => unsub();
  }, []);

  return (
    <div style={pillStyle}>
      <span style={badgeStyle}>{val}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#F3F4F6",         // light gray
  color: "#111827",              // near-black text
  borderRadius: 12,
  padding: "6px 10px",
  border: "1px solid rgba(0,0,0,0.12)",
  boxShadow: "0 2px 6px rgba(0,0,0,.18)",
  userSelect: "none",
};

const badgeStyle = {
  minWidth: 22,
  height: 22,
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 700,
  fontSize: 12,
  background: "#111827",    // dark disc
  color: "#fff",
  lineHeight: "22px",
};
