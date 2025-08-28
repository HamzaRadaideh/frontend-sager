// src/utils/droneUtils.ts
import { COLORS, DRONE_CONFIG } from './constants.js' // same file as before (JS is fine)
import type { DroneProps, HistoryPoint, LngLat } from '../types'
import { distMeters, bearingDeg } from './geomerty'

export function normalizeReg(reg?: string | null): string | null {
  if (!reg) return null
  const up = String(reg).trim().toUpperCase()
  if (!/^S[BD]-[ABCD]{2}$/.test(up)) return null

  const first = up[3]
  const second = up[4]
  if (first !== 'B' && first === second) return null
  return up
}

export function classLetter(reg?: string | null): 'A' | 'B' | 'C' | 'D' | null {
  const up = String(reg ?? '').trim().toUpperCase()
  const m = up.match(/^S[BD]-([ABCD])[ABCD]$/)
  return (m ? (m[1] as 'A' | 'B' | 'C' | 'D') : null)
}

export function canFly(reg?: string | null): boolean {
  return classLetter(reg) === 'B'
}

export function headingFromHistory(hist: HistoryPoint[]): number | null {
  if (!hist || hist.length < 2) return null

  let count = 0
  let vx = 0
  let vy = 0
  for (let i = hist.length - 1; i > 0 && count < 3; i--) {
    const a = hist[i - 1].coord
    const b = hist[i].coord
    if (a[0] === b[0] && a[1] === b[1]) continue
    const d = distMeters(a, b)
    if (d < 1) continue
    const br = (bearingDeg(a, b) * Math.PI) / 180
    vx += Math.sin(br) * d
    vy += Math.cos(br) * d
    count++
  }
  if (count === 0) return null
  const hdg = (Math.atan2(vx, vy) * 180) / Math.PI
  return (hdg + 360) % 360
}

export function shouldUpdatePoint(
  lastPoint: HistoryPoint | undefined,
  newCoord: LngLat,
  now: number
): boolean {
  if (!lastPoint) return true
  const movedEnough = distMeters(lastPoint.coord, newCoord) >= DRONE_CONFIG.MIN_DIST_M
  const waitedEnough = now - lastPoint.ts >= DRONE_CONFIG.MIN_TIME_MS
  return movedEnough && waitedEnough
}

export function getDroneColor(registration?: string | null, props?: DroneProps): string {
  return canFly(registration || props?.registration) ? COLORS.GREEN : COLORS.RED
}
