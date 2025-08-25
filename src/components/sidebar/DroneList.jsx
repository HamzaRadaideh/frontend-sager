// components/sidebar/DroneList.jsx
import React, { useMemo } from "react";
import { useDroneStore } from "../../store/droneStore";
import DroneCard from "./DroneCard";

export default function DroneList() {
  const drones = useDroneStore((state) => state.drones);
  
  const droneList = useMemo(() => Object.values(drones), [drones]);

  if (droneList.length === 0) {
    return (
      <div className="text-center text-gray-400 mt-8">
        <div className="text-2xl mb-2">🚁</div>
        <div>No drones detected</div>
        <div className="text-xs mt-2">Waiting for drone data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {droneList.map((drone) => (
        <DroneCard key={drone.id} drone={drone} />
      ))}
    </div>
  );
}