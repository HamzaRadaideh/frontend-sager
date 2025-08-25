// components/layout/Header.jsx
import React from 'react';

export default function Header() {
  return (
    <header className="h-16 bg-gray-900 text-white flex items-center justify-between px-6 border-b border-gray-700">
      <div className="flex items-center gap-6">
        <div className="text-xl font-bold tracking-widest">SAGER</div>
        <nav className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <div className="w-5 h-5 bg-gray-600 rounded"></div>
            <span>DASHBOARD</span>
          </div>
          <div className="flex items-center gap-2 text-green-400 border-l-2 border-green-400 pl-6">
            <div className="w-5 h-5 bg-green-400 rounded"></div>
            <span>MAP</span>
          </div>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-600 rounded"></div>
          <div className="w-6 h-6 bg-gray-600 rounded"></div>
          <div className="relative">
            <div className="w-6 h-6 bg-gray-600 rounded"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">1</div>
          </div>
        </div>
        <div className="text-sm">
          <div className="text-white">Hello, Mohammed Omar</div>
          <div className="text-xs text-gray-400">Technical Support</div>
        </div>
      </div>
    </header>
  );
}