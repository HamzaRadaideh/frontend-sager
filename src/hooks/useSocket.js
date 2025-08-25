// hooks/useSocket.js
import { useEffect } from "react";
import { createSocket, onMessage, offMessage, disconnectSocket } from "../lib/socket";
import { useDroneStore } from "../store/droneStore";

export function useSocket() {
    const upsertFeature = useDroneStore((state) => state.upsertFeature);

    useEffect(() => {
        const socket = createSocket();

        const handleMessage = (payload) => {
            console.log("Received socket message:", payload);
            const features = payload?.features || [];

            // Process each feature from the backend
            features.forEach((feature) => {
                upsertFeature(feature);
            });
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