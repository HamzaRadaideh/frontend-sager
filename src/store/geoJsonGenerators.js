// store/geoJsonGenerators.js
import { canFly, headingFromHistory } from '../utils/droneUtils.js';

export function generatePointsFC(drones) {
    const features = [];

    for (const d of Object.values(drones)) {
        const hist = d.history;
        const last = hist[hist.length - 1];

        const fallbackHdg = headingFromHistory(hist);
        const hdg = d.hdg != null ? d.hdg : fallbackHdg;

        features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: last.coord },
            properties: {
                id: d.id,
                registration: d.reg ?? d.props?.registration ?? d.id,
                color: d.color,
                firstSeen: d.firstSeen,
                lastSeen: d.lastSeen,
                hdg,
                ...d.props,
            },
        });
    }

    return { type: "FeatureCollection", features };
}

export function generateLinesFC(drones) {
    const features = [];

    for (const d of Object.values(drones)) {
        const regForColor = d.reg ?? d.props?.registration;
        if (d.history.length > 1 && canFly(regForColor)) {
            features.push({
                type: "Feature",
                geometry: { type: "LineString", coordinates: d.history.map((h) => h.coord) },
                properties: {
                    id: d.id,
                    registration: d.reg ?? d.props?.registration ?? d.id,
                    color: d.color,
                },
            });
        }
    }

    return { type: "FeatureCollection", features };
}