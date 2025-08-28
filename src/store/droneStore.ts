import { create } from 'zustand'
import type { DroneStore } from '../types'
import { COLORS } from '../utils/constants'
import { generatePointsFC, generateLinesFC } from './geoJsonGenerators'
import { createUpsertAction } from './droneActions' // we’ll type this in a later batch

export const useDroneStore = create<DroneStore>((set, get) => ({
  // state
  drones: {},
  selectedId: null,
  _pointsFC: null,
  _linesFC: null,
  _pointsDirty: true,
  _linesDirty: true,

  // private
  _markPointsDirty: () => set({ _pointsDirty: true }),
  _markLinesDirty: () => set({ _linesDirty: true }),

  // actions
  upsertFeature: createUpsertAction(set, get),
  select: (id) => set({ selectedId: id }),
  clear: () =>
    set({
      drones: {},
      selectedId: null,
      _pointsFC: null,
      _linesFC: null,
      _pointsDirty: true,
      _linesDirty: true,
    }),

  // cached getters
  getPoints: () => {
    const { drones, _pointsDirty, _pointsFC } = get()
    if (!_pointsDirty && _pointsFC) return _pointsFC
    const fc = generatePointsFC(drones)
    set({ _pointsFC: fc, _pointsDirty: false })
    return fc
  },

  getLines: () => {
    const { drones, _linesDirty, _linesFC } = get()
    if (!_linesDirty && _linesFC) return _linesFC
    const fc = generateLinesFC(drones)
    set({ _linesFC: fc, _linesDirty: false })
    return fc
  },

  redCount: () => {
    const { drones } = get()
    let c = 0
    for (const d of Object.values(drones)) if (d.color === COLORS.RED) c++
    return c
  },
}))
