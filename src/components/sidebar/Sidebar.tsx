// components/sidebar/Sidebar.tsx
import dashboardIcon from "../../assets/dashboard-svgrepo-com-2.svg";
import mapIcon from "../../assets/location-svgrepo-com-2.svg";

type Props = {
  currentPath: string;
  onNavigate: (path: string) => void;
};

export default function Sidebar({ currentPath, onNavigate }: Props) {
  const itemBase = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 14px",
    color: "#c7ccd6",
    fontSize: 13,
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  const activeItemStyle = {
    ...itemBase,
    background: "#151a22",
    color: "white",
    boxShadow: "inset 0 0 0 1px #262e3f",
  };

    const handleNavigation = (path: string) => {
    onNavigate(path);
    };


  return (
    <aside
      style={{
        width: 220,
        background: "#0e1116",
        color: "white",
        padding: 16,
        borderRight: "1px solid #1b2130",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={currentPath === '/' ? activeItemStyle : itemBase}
        onClick={() => handleNavigation('/')}
        onMouseEnter={(e) => {
          if (currentPath !== '/') {
            e.currentTarget.style.background = "#151a2250";
          }
        }}
        onMouseLeave={(e) => {
          if (currentPath !== '/') {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <img src={dashboardIcon} width={18} height={18} alt="dashboard" />
        <span>Dashboard</span>
      </div>

      <div
        style={currentPath === '/map' ? activeItemStyle : itemBase}
        onClick={() => handleNavigation('/map')}
        onMouseEnter={(e) => {
          if (currentPath !== '/map') {
            e.currentTarget.style.background = "#151a2250";
          }
        }}
        onMouseLeave={(e) => {
          if (currentPath !== '/map') {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <img src={mapIcon} width={18} height={18} alt="map" />
        <span>Map</span>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ opacity: 0.6, fontSize: 11 }}>© Sager</div>
    </aside>
  );
}