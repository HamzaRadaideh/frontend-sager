// components/RedCounter.jsx
import { useEffect, useState } from "react";
import { useDroneStore } from "../store/droneStore";

/**
 * Matches Figma pill style (light background + dark circular badge).
 * Label defaults to "red drones".
 */
export default function RedCounter({ label = "red drones" }) {
  const redCountFn = useDroneStore((s) => s.redCount);
  const [val, setVal] = useState(redCountFn());

  useEffect(() => {
    const unsub = useDroneStore.subscribe(() => setVal(redCountFn()));
    return () => unsub();
  }, [redCountFn]);

  return (
    <div style={pillStyle}>
      <span style={badgeStyle}>{val}</span>
      <span style={{ fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "#F3F4F6",         // light gray like the Figma chip
  color: "#111827",
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
  background: "#111827",     // dark disc
  color: "#fff",
  lineHeight: "22px",
};
