import { io } from "socket.io-client";
import { useDroneStore } from "../store/droneStore";

let socket = null;

export function startSocket() {
    if (socket) return socket;
    const upsert = useDroneStore.getState().upsertFeature;

    socket = io("http://localhost:9013", {
        transports: ["polling"],
        path: "/socket.io",
        withCredentials: false,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on("message", (payload) => {
        const features = payload?.features || [];
        for (const f of features) upsert(f);
    });

    return socket;
}
