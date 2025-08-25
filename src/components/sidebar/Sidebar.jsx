// components/sidebar/Sidebar.jsx
import React, { useState } from "react";
import SidebarTabs from "./SidebarTabs";
import DroneList from "./DroneList";
import { SIDEBAR_TABS } from "../../lib/constants";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState(SIDEBAR_TABS.DRONES);

  return (
    <aside className="w-80 bg-gray-800 text-white border-r border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-6 bg-green-400"></div>
          <h2 className="text-sm font-semibold tracking-wider">DRONE FLYING</h2>
          <button className="ml-auto w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-xs hover:bg-gray-500">
            ×
          </button>
        </div>
        
        <SidebarTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === SIDEBAR_TABS.DRONES && <DroneList />}
        
        {activeTab === SIDEBAR_TABS.ALERTS && (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-2xl mb-2">⚠️</div>
            <div>No alerts at the moment</div>
          </div>
        )}
        
        {activeTab === SIDEBAR_TABS.HISTORY && (
          <div className="text-center text-gray-400 mt-8">
            <div className="text-2xl mb-2">📊</div>
            <div>Flight history will appear here</div>
          </div>
        )}
      </div>
    </aside>
  );
}