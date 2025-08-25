export default function Header() {
  return (
    <header
      style={{
        height: 56,
        background: "#111827",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
      }}
    >
      <div style={{ fontWeight: 700, letterSpacing: 1 }}>SAGER</div>
      <div style={{ opacity: 0.8 }}>Hello, Mohammed Omar</div>
    </header>
  );
}
