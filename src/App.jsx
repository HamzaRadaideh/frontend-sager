// App.jsx
import React from 'react';
import Layout from './components/layout/Layout';
import DroneMap from './components/map/DroneMap';
import Sidebar from './components/sidebar/Sidebar';
import RedCounter from './components/ui/RedCounter';
import { useSocket } from './hooks/useSocket';

export default function App() {
  // Initialize socket connection
  useSocket();

  return (
    <Layout>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex-1 relative">
          <DroneMap />
        </div>
      </div>
      <RedCounter />
    </Layout>
  );
}