// src/store/droneActions.ts
import type { Feature, Point } from 'geojson'
import type { Drone, DroneProps, DroneStore, HistoryPoint, LngLat } from '../types'
import { DRONE_CONFIG } from '../utils/constants.js'
import { normalizeReg, canFly, shouldUpdatePoint, getDroneColor } from '../utils/droneUtils'
import { distMeters, bearingDeg, blendAngles } from '../utils/geomerty'


export function createUpsertAction(
  set: (fn: (state: DroneStore) => Partial<DroneStore>) => void,
  _get: () => DroneStore
) {
  return (f: Feature<Point, any>) => {
    if (!f || f.geometry?.type !== 'Point') return

    const p = (f.properties ?? {}) as DroneProps & Record<string, unknown>
    const coord = f.geometry.coordinates as number[] // [lng, lat, ...]
    if (!Array.isArray(coord) || coord.length < 2) return
    const lngLat: LngLat = [coord[0], coord[1]]

    const regNorm = normalizeReg(p.registration ?? null)
    const id =
      regNorm ??
      (p.registration ? String(p.registration).toUpperCase() : null) ??
      (p as any).serial ??
      'UNKNOWN'

    const now = Date.now()

    set((state: DroneStore) => {
      const map = { ...state.drones }
      const existing = map[id]

      const nextColor = getDroneColor(regNorm, p)
      let pointsDirty = false
      let linesDirty = false

      if (!existing) {
        map[id] = createNewDrone(id, regNorm, p, lngLat, now, nextColor)
        pointsDirty = true
        linesDirty = true
      } else {
        const updates = updateExistingDrone(existing, p, lngLat, now, nextColor)
        pointsDirty = updates.pointsDirty
        linesDirty = updates.linesDirty
      }

      return {
        drones: map,
        _pointsDirty: state._pointsDirty || pointsDirty,
        _linesDirty: state._linesDirty || linesDirty,
      }
    })
  }
}

function createNewDrone(
  id: string,
  regNorm: string | null,
  props: DroneProps,
  coord: LngLat,
  now: number,
  color: string
): Drone {
  const first: HistoryPoint = {
    coord: [coord[0], coord[1]],
    ts: now,
    ...(props.altitude != null ? { altitude: Number(props.altitude) } : {}),
  }
  return {
    id,
    reg: regNorm,
    props: { ...props },
    history: [first],
    color,
    firstSeen: now,
    lastSeen: now,
    hdg: null,
  }
}

function updateExistingDrone(
  existing: Drone,
  props: DroneProps,
  coord: LngLat,
  now: number,
  nextColor: string
): { pointsDirty: boolean; linesDirty: boolean } {
  let pointsDirty = false
  let linesDirty = false

  // Merge props
  existing.props = { ...existing.props, ...props }

  // Update history if point is significant
  const hist = existing.history
  const last = hist[hist.length - 1]
  const [lng, lat] = coord

  if (shouldUpdatePoint(last, [lng, lat], now)) {
    hist.push({
      coord: [lng, lat],
      ts: now,
      ...(props.altitude != null ? { altitude: Number(props.altitude) } : {}),
    })

    if (hist.length > DRONE_CONFIG.MAX_HISTORY) {
      hist.splice(0, hist.length - DRONE_CONFIG.MAX_HISTORY)
    }

    // Update smoothed heading if segment is long enough
    const segDist = last ? distMeters(last.coord, [lng, lat]) : 0
    if (last && segDist >= DRONE_CONFIG.HDG_MIN_SEG_M) {
      const segHdg = bearingDeg(last.coord, [lng, lat])
      existing.hdg = blendAngles(existing.hdg, segHdg, DRONE_CONFIG.HDG_ALPHA)
    }

    pointsDirty = true

    if (canFly(existing.reg ?? existing.props?.registration ?? props.registration ?? null)) {
      linesDirty = true
    }
  }

  // Update color if changed
  if (existing.color !== nextColor) {
    existing.color = nextColor
    pointsDirty = true
    linesDirty = true
  }

  existing.lastSeen = now

  return { pointsDirty, linesDirty }
}
