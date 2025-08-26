import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DroneMap from "./components/DroneMap";

export default function App() {
  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#0b0f14" }}>
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
