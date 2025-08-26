// lib/socket.js
import { io } from "socket.io-client";
import { useDroneStore } from "../store/droneStore";

let socket = null;
let isConnected = false;

export function startSocket() {
    if (isConnected) return socket;

    const upsert = useDroneStore.getState().upsertFeature;

    socket = io("http://localhost:9013", {
        transports: ["polling"],
        path: "/socket.io",
        withCredentials: false,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
        isConnected = true;
        console.log("Socket connected");
    });

    socket.on("disconnect", () => {
        isConnected = false;
        console.log("Socket disconnected");
    });

    socket.on("message", (payload) => {
        const features = payload?.features || [];
        for (const f of features) upsert(f);
    });

    return socket;
}