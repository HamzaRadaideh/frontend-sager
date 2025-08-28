// src/utils/geomerty.ts
import type { LngLat } from '../types'

const toRad = (d: number): number => (d * Math.PI) / 180
const toDeg = (r: number): number => (r * 180) / Math.PI

/** Fast equirectangular approximation — good enough for short drone segments. */
export function distMeters(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const R = 6371000 // meters
  const x = toRad(lng2 - lng1) * Math.cos(toRad((lat1 + lat2) / 2))
  const y = toRad(lat2 - lat1)
  return Math.hypot(x, y) * R
}

/** Initial bearing from a → b in degrees [0,360) using great-circle formula. */
export function bearingDeg(a: LngLat, b: LngLat): number {
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const λ1 = toRad(lng1)
  const λ2 = toRad(lng2)
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Exponential moving average on circular data (degrees). */
export function blendAngles(prevDeg: number | null, newDeg: number, alpha = 0.65): number {
  if (prevDeg == null || Number.isNaN(prevDeg)) return newDeg
  const pr = (prevDeg * Math.PI) / 180
  const nr = (newDeg * Math.PI) / 180
  const wPrev = 1 - alpha
  const wNew = alpha
  const vx = Math.sin(pr) * wPrev + Math.sin(nr) * wNew
  const vy = Math.cos(pr) * wPrev + Math.cos(nr) * wNew
  return (Math.atan2(vx, vy) * 180) / Math.PI + 360 % 360
}
