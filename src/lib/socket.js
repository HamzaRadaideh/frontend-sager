// lib/socket.js
import { io } from "socket.io-client";
import { SOCKET_CONFIG } from "./constants";

let socket = null;

export function createSocket() {
    if (socket) return socket;

    socket = io(SOCKET_CONFIG.URL, {
        transports: SOCKET_CONFIG.TRANSPORTS,
        path: SOCKET_CONFIG.PATH,
        withCredentials: SOCKET_CONFIG.WITH_CREDENTIALS,
        reconnectionAttempts: SOCKET_CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: SOCKET_CONFIG.RECONNECTION_DELAY,
    });

    return socket;
}

export function getSocket() {
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function onMessage(callback) {
    if (!socket) return;
    socket.on("message", callback);
}

export function offMessage(callback) {
    if (!socket) return;
    socket.off("message", callback);
}