import { useEffect, useState } from "react";
import { useDroneStore } from "../store/droneStore";

export default function RedCounter() {
  const redCountFn = useDroneStore((s) => s.redCount);
  const [val, setVal] = useState(redCountFn());

  useEffect(() => {
    const unsub = useDroneStore.subscribe(() => setVal(redCountFn()));
    return () => unsub();
  }, [redCountFn]);

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        background: "#111827",
        color: "white",
        borderRadius: 16,
        padding: "8px 12px",
        fontSize: 12,
        border: "1px solid #374151",
      }}
    >
      <b>{val}</b> red drone{val === 1 ? "" : "s"}
    </div>
  );
}
