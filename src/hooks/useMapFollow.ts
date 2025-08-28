// hooks/useMapFollow.ts
import { useRef } from 'react';
import { MAP_CONFIG } from '../utils/constants';
import { distMeters } from '../utils/geomerty';

export function useMapFollow() {
    const lastFollowCoord = useRef<[number, number] | null>(null);
    const lastUserActionTs = useRef(0);

    const markUserAction = () => {
        lastUserActionTs.current = Date.now();
    };

    type PointsFC = GeoJSON.FeatureCollection<GeoJSON.Point, { id: string }>;


    const followDrone = (map: mapboxgl.Map, selectedId: string | null, points: PointsFC) => { 
        if (!selectedId || !map) return;

        const feature = points.features.find((ft: { properties: { id: string; }; }) => ft?.properties?.id === selectedId);
        const coord = feature?.geometry?.coordinates;
        const last = lastFollowCoord.current;
        const userCoolingDown = Date.now() - lastUserActionTs.current < MAP_CONFIG.USER_COOLDOWN_MS;

        if (coord && !userCoolingDown) {
            if (
                !last ||
                distMeters(
                    last as [number, number],
                    coord as [number, number]
                ) > MAP_CONFIG.FOLLOW_MIN_DIST_M
            ) {
                map.easeTo({ center: coord as [number, number], duration: 350 });
                lastFollowCoord.current = coord as [number, number];
            }
        }
    };

    const flyToInitial = (map: mapboxgl.Map, selectedId: string | null, points: PointsFC) => {
        if (!selectedId || !map) return;
        const feature = points.features.find(ft => ft?.properties?.id === selectedId);
        const coord = feature?.geometry?.coordinates as [number, number] | undefined;

        if (coord) {
        map.flyTo({ center: coord, zoom: Math.max(13, map.getZoom()), speed: 1.6 });
        lastFollowCoord.current = coord;
        }
    };

  return { markUserAction, followDrone, flyToInitial };
}