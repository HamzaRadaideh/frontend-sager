// components/dashboard/DroneListCard.jsx
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function DroneListCard({ drones }) {
  return (
    <div style={{
      background: '#10151c',
      borderRadius: 14,
      border: '1px solid #1f2735',
      color: 'white',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2735' }}>
        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>Active Drones</div>
      </div>
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {Object.values(drones).map((drone, idx) => {
          const flightTime = (Date.now() - drone.firstSeen) / 1000;
          const isFlying = drone.color === '#22c55e';
          return (
            <div key={drone.id} style={{
              padding: 16,
              borderBottom: idx < Object.values(drones).length - 1 ? '1px solid #1a1f2e' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: drone.color,
                  boxShadow: `0 0 0 2px ${drone.color}20`
                }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{drone.props.Name}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                    {drone.props.registration} • {drone.props.pilot}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: isFlying ? '#22c55e20' : '#ef444420',
                  color: isFlying ? '#22c55e' : '#ef4444',
                  marginBottom: 4
                }}>
                  {isFlying ? 'FLYING' : 'LANDED'}
                </div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>{formatTime(flightTime)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}