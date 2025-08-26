// components/layout/Header.jsx
import bellIcon from "../../assets/bell.svg";
import langIcon from "../../assets/language-svgrepo-com.svg";
import captureIcon from "../../assets/capture-svgrepo-com.svg";

export default function Header() {
  const iconBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 10,
    background: "#151a22",
    border: "1px solid #262e3f",
    cursor: "pointer",
  };

  return (
    <header
      style={{
        height: 56,
        background: "#0e1116",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid #1b2130",
      }}
    >
      <div style={{ fontWeight: 800, letterSpacing: 1.2 }}>SAGER</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ ...iconBtn }} title="Screenshot">
          <img src={captureIcon} width={16} height={16} alt="capture" />
        </div>
        <div style={{ ...iconBtn }} title="Language">
          <img src={langIcon} width={16} height={16} alt="language" />
        </div>
        <div style={{ ...iconBtn }} title="Notifications">
          <img src={bellIcon} width={16} height={16} alt="bell" />
        </div>
        <div style={{ width: 1, height: 24, background: "#1b2130", margin: "0 4px" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Hello, Mohammed Omar</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: -2 }}>Technical Support</div>
        </div>
      </div>
    </header>
  );
}