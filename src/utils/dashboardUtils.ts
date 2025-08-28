// src/utils/dashboardUtils.ts
import type { Drone, DronesMap } from '../types'

export const formatTime = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const secs = s % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const formatDuration = (ms: number): string => {
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export interface DashboardStats {
  activeDrones: number
  totalDrones: number
  /** seconds */
  totalFlightTime: number
  /** seconds */
  avgFlightTime: number
  /** 0–100 */
  efficiency: number
}

export interface FlightTimeDatum {
  name: string
  flightTime: number // minutes
  status: 'Flying' | 'Landed'
}

export interface ActivityDatum {
  time: string
  active: number
  total: number
}

export interface StatusDatum {
  name: 'Flying' | 'Landed'
  value: number
  color: string
}

export interface PilotDatum {
  pilot: string
  flying: number
  landed: number
  total: number
}

export const calculateStats = (drones: DronesMap): DashboardStats => {
  const list: Drone[] = Object.values(drones)
  const totalDrones = list.length
  const activeDrones = list.filter(d => d.color === '#22c55e').length

  const totalFlightTimeMs = list.reduce((acc, d) => acc + (Date.now() - d.firstSeen), 0)
  const totalFlightTimeSec = totalFlightTimeMs / 1000
  const avgFlightTimeSec = totalDrones > 0 ? totalFlightTimeSec / totalDrones : 0
  const efficiency = totalDrones > 0 ? Math.round((activeDrones / totalDrones) * 100) : 0

  return {
    activeDrones,
    totalDrones,
    totalFlightTime: totalFlightTimeSec,
    avgFlightTime: avgFlightTimeSec,
    efficiency,
  }
}

export interface ChartData {
  flightTimeData: FlightTimeDatum[]
  activityData: ActivityDatum[]
  statusData: StatusDatum[]
  pilotData: PilotDatum[]
}

export const generateChartData = (drones: DronesMap, stats: DashboardStats): ChartData => {
  const list: Drone[] = Object.values(drones)

  const flightTimeData: FlightTimeDatum[] = list.map(drone => ({
    name: (drone.props.Name ?? 'Drone').slice(0, 10),
    flightTime: Math.round((Date.now() - drone.firstSeen) / 60000),
    status: drone.color === '#22c55e' ? 'Flying' : 'Landed',
  }))

  // last 6 hours (fake activity envelope similar to your original)
  const activityData: ActivityDatum[] = []
  for (let i = 5; i >= 0; i--) {
    const hour = new Date()
    hour.setHours(hour.getHours() - i)
    const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false })
    const baseline = Math.max(1, stats.activeDrones - 2)
    const jitter = stats.activeDrones > 0 ? Math.floor(Math.random() * stats.activeDrones) : 0
    activityData.push({
      time: hourStr,
      active: baseline + jitter,
      total: stats.totalDrones,
    })
  }

  const statusData: StatusDatum[] = [
    { name: 'Flying', value: stats.activeDrones, color: '#22c55e' },
    { name: 'Landed', value: stats.totalDrones - stats.activeDrones, color: '#ef4444' },
  ]

  const pilotMap: Record<string, { flying: number; total: number }> = {}
  for (const drone of list) {
    const pilot = drone.props.pilot ?? 'Unknown'
    if (!pilotMap[pilot]) pilotMap[pilot] = { flying: 0, total: 0 }
    pilotMap[pilot].total++
    if (drone.color === '#22c55e') pilotMap[pilot].flying++
  }

  const pilotData: PilotDatum[] = Object.entries(pilotMap).map(([pilot, p]) => ({
    pilot,
    flying: p.flying,
    landed: p.total - p.flying,
    total: p.total,
  }))

  return { flightTimeData, activityData, statusData, pilotData }
}
