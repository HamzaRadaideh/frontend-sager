// src/store/geoJsonGenerators.ts
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import type { DronesMap, DronesLinesFC, DronesPointsFC, DronePointProps } from '../types'
import { headingFromHistory } from '../utils/droneUtils'

export function generatePointsFC(drones: DronesMap): DronesPointsFC {
  const features: FeatureCollection<Point, DronePointProps>['features'] = []

  for (const d of Object.values(drones)) {
    const hist = d.history
    const last = hist[hist.length - 1]
    const fallbackHdg = headingFromHistory(hist)
    const hdg = d.hdg != null ? d.hdg : fallbackHdg

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: last.coord },
      properties: {
        id: d.id,
        registration: (d.reg ?? d.props?.registration ?? d.id) as string,
        color: d.color,
        firstSeen: d.firstSeen,
        lastSeen: d.lastSeen,
        hdg,
        ...d.props,
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

export function generateLinesFC(drones: DronesMap): DronesLinesFC {
  const features: Array<
    Feature<LineString, { id: string; registration: string; color: string }>
  > = []

  for (const d of Object.values(drones)) {
    // const regForColor = d.reg ?? d.props?.registration
    // && canFly(regForColor ?? null) /// use this to show only flyable drones (green drones)
    if (d.history.length > 1 ) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: d.history.map((h) => h.coord) },
        properties: {
          id: d.id,
          registration: (d.reg ?? d.props?.registration ?? d.id) as string,
          color: d.color,
        },
      })
    }
  }

  return { type: 'FeatureCollection', features }
}
