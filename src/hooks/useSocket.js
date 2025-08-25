// hooks/useSocket.js
import { useEffect } from "react";
import { createSocket, onMessage, offMessage, disconnectSocket } from "../lib/socket";
import { useDroneStore } from "../store/droneStore";
import { assignTracks } from "../lib/tracker";

export function useSocket() {
    const upsertFeature = useDroneStore((state) => state.upsertFeature);

    useEffect(() => {
        createSocket();

        const handleMessage = (payload) => {
            console.log("Received socket message:", payload);
            // stitch stable tracks client-side, then upsert
            const tracked = assignTracks(payload?.features || []);
            tracked.forEach(upsertFeature);
        };

        // Set up socket listeners
        onMessage(handleMessage);

        // Cleanup on unmount
        return () => {
            offMessage(handleMessage);
            disconnectSocket();
        };
    }, [upsertFeature]);
}