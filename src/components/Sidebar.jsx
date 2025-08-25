import { useMemo } from "react";
import { useDroneStore } from "../store/droneStore";

export default function Sidebar() {
  const drones = useDroneStore((s) => s.drones);
  const selectedId = useDroneStore((s) => s.selectedId);
  const select = useDroneStore((s) => s.select);

  const list = useMemo(() => Object.values(drones), [drones]);

  return (
    <aside style={{ width: 320, background: "#1f2937", color: "white", padding: 12, overflowY: "auto" }}>
      <h2 style={{ margin: "6px 8px 12px", fontSize: 14, letterSpacing: 1 }}>DRONE FLYING</h2>
      {list.map((d) => {
        const isSel = d.id === selectedId;
        return (
          <div
            key={d.id}
            onClick={() => select(d.id)}
            style={{
              cursor: "pointer",
              background: isSel ? "#374151" : "transparent",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              border: "1px solid #374151",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{d.props?.Name || "Drone"}</strong>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>
              <div>Serial # {d.props?.serial}</div>
              <div>Registration # {d.props?.registration}</div>
              <div>Pilot {d.props?.pilot}</div>
              <div>Organization {d.props?.organization}</div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
