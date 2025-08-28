import type { Feature, FeatureCollection, LineString, Point } from 'geojson'

export type LngLat = [number, number]

export interface DroneProps {
  Name: string
  registration?: string
  pilot?: string
  serial?: string
  organization?: string
  altitude?: number
  [k: string]: unknown
}

export interface HistoryPoint {
  coord: LngLat
  ts: number
  altitude?: number
}

export interface Drone {
  id: string
  reg: string | null
  props: DroneProps
  history: HistoryPoint[]
  color: string
  firstSeen: number
  lastSeen: number
  hdg: number | null
}

export interface DronePointProps extends DroneProps {
  id: string
  registration: string
  color: string
  firstSeen: number
  lastSeen: number
  hdg: number | null
}

export type DronesMap = Record<string, Drone>

export type DronesPointsFC = FeatureCollection<Point, DronePointProps>
export type DronesLinesFC = FeatureCollection<LineString, { id: string; registration: string; color: string }>

export interface DroneStore {
  // state
  drones: DronesMap
  selectedId: string | null
  _pointsFC: DronesPointsFC | null
  _linesFC: DronesLinesFC | null
  _pointsDirty: boolean
  _linesDirty: boolean

  // private markers
  _markPointsDirty: () => void
  _markLinesDirty: () => void

  // actions
  upsertFeature: (f: Feature<Point, any>) => void
  select: (id: string | null) => void
  clear: () => void

  // cached getters
  getPoints: () => DronesPointsFC
  getLines: () => DronesLinesFC

  // derived
  redCount: () => number
}
