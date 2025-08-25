// components/map/DronePopup.jsx
import React from "react";
import ReactDOMServer from "react-dom/server";
import { calculateFlightTime } from "../../utils/droneUtils";
import { formatAltitude, formatFlightTime } from "../../utils/formatters";

export default function DronePopup({ properties }) {
  const firstSeen = Number(properties?.firstSeen || Date.now());
  const flightSecs = calculateFlightTime(firstSeen);
  const flightTime = formatFlightTime(flightSecs);

  return (
    <div style={{ font: "12px/1.4 sans-serif" }}>
      <b>{properties?.Name || "Drone"}</b>
      <br />
      Altitude: {formatAltitude(properties?.altitude)}
      <br />
      Flight Time: {flightTime}
      {properties?.registration && (
        <>
          <br />
          Reg: <span style={{ fontFamily: "monospace" }}>{properties.registration}</span>
        </>
      )}
      {properties?.serial && (
        <>
          <br />
          Serial: <span style={{ fontFamily: "monospace" }}>{properties.serial}</span>
        </>
      )}
      {properties?.pilot && (
        <>
          <br />
          Pilot: {properties.pilot}
        </>
      )}
    </div>
  );
}

