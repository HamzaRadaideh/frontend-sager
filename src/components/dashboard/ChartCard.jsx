// components/dashboard/ChartCard.jsx
export default function ChartCard({ title, children, height = 300 }) {
  return (
    <div style={{
      background: '#10151c',
      borderRadius: 14,
      border: '1px solid #1f2735',
      padding: 20,
      color: 'white'
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, opacity: 0.9 }}>
        {title}
      </div>
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}