// hooks/useMapFollow.js
import { useRef } from 'react';
import { MAP_CONFIG } from '../utils/constants.js';
import { distMeters } from '../utils/geomerty.js';

export function useMapFollow() {
    const lastFollowCoord = useRef(null);
    const lastUserActionTs = useRef(0);

    const markUserAction = () => {
        lastUserActionTs.current = Date.now();
    };

    const followDrone = (map, selectedId, points) => {
        if (!selectedId || !map) return;

        const feature = points.features.find((ft) => ft?.properties?.id === selectedId);
        const coord = feature?.geometry?.coordinates;
        const last = lastFollowCoord.current;
        const userCoolingDown = Date.now() - lastUserActionTs.current < MAP_CONFIG.USER_COOLDOWN_MS;

        if (coord && !userCoolingDown) {
            if (!last || distMeters(last, coord) > MAP_CONFIG.FOLLOW_MIN_DIST_M) {
                map.easeTo({ center: coord, duration: 350 });
                lastFollowCoord.current = coord;
            }
        }
    };

    const flyToInitial = (map, selectedId, points) => {
        if (!selectedId || !map) return;

        const feature = points.features.find((ft) => ft?.properties?.id === selectedId);
        const coord = feature?.geometry?.coordinates;

        if (coord) {
            map.flyTo({ center: coord, zoom: Math.max(13, map.getZoom()), speed: 1.6 });
            lastFollowCoord.current = coord;
        }
    };

    return {
        markUserAction,
        followDrone,
        flyToInitial,
    };
}