// components/counters/RedCounter.tsx
import { useEffect, useState } from "react";
import { useDroneStore } from "../../store/droneStore";
import { counterStyles } from "./counterStyles";

export default function RedCounter({ label = "red drones" }) {
  const redCountFn = useDroneStore((s) => s.redCount);
  const [val, setVal] = useState(redCountFn());

  useEffect(() => {
    const unsub = useDroneStore.subscribe(() => setVal(redCountFn()));
    return () => unsub();
  }, [redCountFn]);

  return (
    <div style={counterStyles.pill}>
      <span style={counterStyles.badge}>{val}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}

