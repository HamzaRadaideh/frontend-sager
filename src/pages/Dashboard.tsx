// pages/Dashboard.tsx
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useDroneStore } from '../store/droneStore';
import StatusCard from '../components/dashboard/StatusCard';
import ChartCard from '../components/dashboard/ChartCard';
import DroneListCard from '../components/dashboard/DroneListCard';
import { calculateStats, generateChartData, formatDuration } from '../utils/dashboardUtils';

export default function Dashboard() {
  const drones = useDroneStore(state => state.drones);
  
  const stats = useMemo(() => calculateStats(drones), [drones]);
  const chartData = useMemo(() => generateChartData(drones, stats), [drones, stats]);

  return (
    <div style={{
      background: '#0b0f14',
      minHeight: '100vh',
      padding: 24,
      color: 'white'
    }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: 1 }}>
          DASHBOARD
        </h1>
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          Real-time drone operations overview and analytics
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <StatusCard
          title="ACTIVE DRONES"
          value={stats.activeDrones}
          subtitle={`of ${stats.totalDrones} total`}
          icon="🚁"
          color="#22c55e"
          trend={{ type: 'up', value: '+2' }}
        />
        <StatusCard
          title="FLIGHT EFFICIENCY"
          value={`${stats.efficiency}%`}
          subtitle="operational rate"
          icon="📊"
          color="#3b82f6"
          trend={{ type: 'up', value: '+5%' }}
        />
        <StatusCard
          title="TOTAL FLIGHT TIME"
          value={formatDuration(stats.totalFlightTime * 1000)}
          subtitle="across all drones"
          icon="⏱️"
          color="#f59e0b"
        />
        <StatusCard
          title="AVG FLIGHT TIME"
          value={formatDuration(stats.avgFlightTime * 1000)}
          subtitle="per drone"
          icon="⏱️"
          color="#8b5cf6"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Activity Timeline */}
        <ChartCard title="Drone Activity Timeline">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2735" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280" 
                fontSize={12}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  color: 'white'
                }}
              />
              <Area
                type="monotone"
                dataKey="active"
                stroke="#22c55e"
                fill="url(#colorActive)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard title="Fleet Status Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16 }}>
            {chartData.statusData.map((item) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: item.color
                }} />
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Flight Duration by Drone */}
        <ChartCard title="Flight Duration by Drone">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.flightTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2735" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280" 
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  color: 'white'
                }}
                formatter={(value) => [`${value} min`, 'Flight Time']}
              />
              <Bar 
                dataKey="flightTime" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pilot Performance */}
        <ChartCard title="Pilot Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.pilotData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2735" />
              <XAxis dataKey="pilot" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: 8,
                  color: 'white'
                }}
              />
              <Bar dataKey="flying" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="landed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Drone List */}
      <DroneListCard drones={drones} />
    </div>
  );
}