// store/droneStore.js
import { create } from "zustand";
import { COLORS } from '../utils/constants.js';
import { createUpsertAction } from './droneActions.js';
import { generatePointsFC, generateLinesFC } from './geoJsonGenerators.js';

export const useDroneStore = create((set, get) => ({
    // State
    drones: {},
    selectedId: null,
    _pointsFC: null,
    _linesFC: null,
    _pointsDirty: true,
    _linesDirty: true,

    // Private methods
    _markPointsDirty: () => set({ _pointsDirty: true }),
    _markLinesDirty: () => set({ _linesDirty: true }),

    // Actions
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

    // Cached getters
    getPoints: () => {
        const { drones, _pointsDirty, _pointsFC } = get();
        if (!_pointsDirty && _pointsFC) return _pointsFC;

        const fc = generatePointsFC(drones);
        set({ _pointsFC: fc, _pointsDirty: false });
        return fc;
    },

    getLines: () => {
        const { drones, _linesDirty, _linesFC } = get();
        if (!_linesDirty && _linesFC) return _linesFC;

        const fc = generateLinesFC(drones);
        set({ _linesFC: fc, _linesDirty: false });
        return fc;
    },

    redCount: () => {
        const { drones } = get();
        let c = 0;
        for (const d of Object.values(drones)) if (d.color === COLORS.RED) c++;
        return c;
    },
}));