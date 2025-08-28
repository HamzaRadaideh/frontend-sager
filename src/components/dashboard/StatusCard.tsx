import { ReactNode } from 'react';

type Trend = { type: 'up' | 'down'; value: string };

type Props = {
  title: ReactNode; value: ReactNode; subtitle?: ReactNode;
  icon?: ReactNode; color?: string; trend?: Trend;
};

export default function StatusCard({ title, value, subtitle, icon, color = '#22c55e', trend }: Props) {
  return (
    <div style={{
      background: '#10151c',
      borderRadius: 14,
      border: '1px solid #1f2735',
      padding: 20,
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, opacity: 0.7, letterSpacing: 0.5 }}>{title}</div>
        {icon && <div style={{ color, fontSize: 18 }}>{icon}</div>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, opacity: 0.6 }}>{subtitle}</div>}
      {trend && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 4,
          background: trend.type === 'up' ? '#22c55e20' : '#ef444420',
          color: trend.type === 'up' ? '#22c55e' : '#ef4444'
        }}>
          {trend.type === 'up' ? '↗' : '↘'} {trend.value}
        </div>
      )}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${color}50, ${color})`
      }} />
    </div>
  );
}
