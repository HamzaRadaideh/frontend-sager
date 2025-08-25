// components/sidebar/SidebarTabs.jsx
import React from "react";
import { SIDEBAR_TABS } from "../../lib/constants";

export default function SidebarTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: SIDEBAR_TABS.DRONES, label: "Drones" },
    { id: SIDEBAR_TABS.ALERTS, label: "Alerts" },
    { id: SIDEBAR_TABS.HISTORY, label: "History" },
  ];

  return (
    <div className="flex gap-1 bg-gray-700 rounded p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-green-500 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-600"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}