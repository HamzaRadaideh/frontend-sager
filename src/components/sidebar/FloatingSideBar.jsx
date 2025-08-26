// components/sidebar/FloatingSideBar.jsx
import { useMemo } from "react";
import { useDroneStore } from "../../store/droneStore";

export default function FloatingSideBar() {
  const drones = useDroneStore((s) => s.drones);
  const selectedId = useDroneStore((s) => s.selectedId);
  const select = useDroneStore((s) => s.select);

  const list = useMemo(() => Object.values(drones), [drones]);

  return (
    <div
      style={{
        width: 320,
        background: "#10151c",
        color: "white",
        borderRadius: 14,
        border: "1px solid #1f2735",
        boxShadow: "0 16px 50px rgba(0,0,0,.45)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh",
      }}
    >
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #1b2130" }}>
        <div style={{ fontSize: 14, letterSpacing: .4, marginBottom: 6, opacity: .9 }}>
          DRONE FLYING
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 12 }}>
          <div style={{ position: "relative", color: "white" }}>
            Drones
            <span
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -8,
                height: 2,
                background: "#22c55e",
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ opacity: 0.5 }}>Flights History</div>
        </div>
      </div>

      <div style={{ padding: 12, overflowY: "auto" }}>
        {list.map((d) => {
          const isSel = d.id === selectedId;
          return (
            <div
              key={d.id}
              onClick={() => select(d.id)}
              style={{
                cursor: "pointer",
                background: isSel ? "#18202c" : "transparent",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
                border: "1px solid #243049",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontWeight: 600 }}>{d.props?.Name || "Drone"}</strong>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: d.color,
                    boxShadow: "0 0 0 2px #0e1116",
                  }}
                />
              </div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6, lineHeight: 1.5 }}>
                <div>Serial # {d.props?.serial}</div>
                <div>Registration # {d.props?.registration}</div>
                <div>Pilot {d.props?.pilot}</div>
                <div>Organization {d.props?.organization}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}