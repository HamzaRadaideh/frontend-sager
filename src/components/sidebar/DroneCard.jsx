// components/sidebar/DroneCard.jsx
import React from "react";
import { useDroneStore } from "../../store/droneStore";
import { COLORS } from "../../lib/constants";

export default function DroneCard({ drone }) {
  const selectedId = useDroneStore((state) => state.selectedId);
  const select = useDroneStore((state) => state.select);
  
  const isSelected = drone.id === selectedId;
  const isAuthorized = drone.color === COLORS.AUTHORIZED;

  const handleClick = () => {
    select(drone.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`cursor-pointer rounded-lg p-4 border transition-all hover:shadow-lg ${
        isSelected
          ? "border-green-400 bg-gray-700 shadow-md"
          : "border-gray-600 bg-gray-750 hover:border-gray-500"
      }`}
    >
      {/* Drone Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm">
          {drone.props?.Name || "Unknown Drone"}
        </div>
        <div
          className={`w-3 h-3 rounded-full ${
            isAuthorized ? "bg-green-400" : "bg-red-400"
          }`}
          title={isAuthorized ? "Authorized to fly" : "Not authorized"}
        />
      </div>

      {/* Drone Details */}
      <div className="space-y-2 text-xs text-gray-300">
        <div className="flex justify-between">
          <span className="text-gray-400">Serial #</span>
          <span className="font-mono">{drone.props?.serial || "N/A"}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Registration #</span>
          <span
            className={`font-mono ${
              isAuthorized ? "text-green-400" : "text-red-400"
            }`}
          >
            {drone.props?.registration || "N/A"}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Pilot</span>
          <span>{drone.props?.pilot || "Unknown"}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Organization</span>
          <span className="truncate ml-2" title={drone.props?.organization}>
            {drone.props?.organization || "Unknown"}
          </span>
        </div>

        {/* Additional info when selected */}
        {isSelected && (
          <>
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Altitude</span>
                <span>{drone.props?.altitude || 0} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Yaw</span>
                <span>{drone.props?.yaw || 0}°</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}