// App.jsx
import Header from "./components/layout/Header";
import Sidebar from "./components/sidebar/Sidebar";
import DroneMap from "./components/map/DroneMap";

export default function App() {
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
        <Sidebar />
        <div style={{ flex: 1, position: "relative" }}>
          <DroneMap />
        </div>
      </div>
    </div>
  );
}