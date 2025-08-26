// components/counters/GreenCounter.jsx
import { useEffect, useState } from "react";
import { useDroneStore } from "../../store/droneStore";
import { counterStyles } from "./counterStyles";

export default function GreenCounter({ label = "Drone Flying" }) {
  const initial = (() => {
    const drones = useDroneStore.getState().drones;
    return Object.values(drones).filter((d) => d.color === "#22c55e").length;
  })();
  const [val, setVal] = useState(initial);

  useEffect(() => {
    const unsub = useDroneStore.subscribe((s) => {
      const c = Object.values(s.drones).filter((d) => d.color === "#22c55e").length;
      setVal(c);
    });
    return () => unsub();
  }, []);

  return (
    <div style={counterStyles.pill}>
      <span style={counterStyles.badge}>{val}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}