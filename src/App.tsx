import { useState, useEffect, type SetStateAction } from 'react';
import Header from "./components/layout/Header";
import Sidebar from "./components/sidebar/Sidebar";
import Dashboard from "./pages/Dashboard";
import Map from "./pages/Map";
import { startSocket } from "./lib/socket";

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');

  // Start WebSocket connection when app mounts
  useEffect(() => {
    startSocket();
  }, []);

  const handleNavigate = (path: SetStateAction<string>) => {
    setCurrentPath(path);
  };

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/':
        return <Dashboard />;
      case '/map':
        return <Map />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ 
      height: "100vh", 
      width: "100vw", 
      display: "flex", 
      flexDirection: "column", 
      background: "#0b0f14" 
    }}>
      <Header />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar 
          currentPath={currentPath} 
          onNavigate={handleNavigate} 
        />
        <div style={{ 
          flex: 1, 
          position: "relative",
          overflow: currentPath === '/' ? 'auto' : 'hidden'
        }}>
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
}