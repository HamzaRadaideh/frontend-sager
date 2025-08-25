// lib/constants.js
export const SOCKET_CONFIG = {
    URL: "http://localhost:9013",
    TRANSPORTS: ["polling"],
    PATH: "/socket.io",
    WITH_CREDENTIALS: false,
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
};

export const MAP_CONFIG = {
    STYLE_URL: `https://api.maptiler.com/maps/darkmatter/style.json?key=${import.meta.env.VITE_MAP_KEY}`,
    CENTER: [35.9313, 31.9488],
    ZOOM: 12,
    MAX_TRAIL_LENGTH: 500,
};

export const COLORS = {
    AUTHORIZED: "#22c55e",
    UNAUTHORIZED: "#ef4444",
    SELECTED: "#3b82f6",
};

export const DRONE_ICONS = {
    ARROW_GREEN: "arrow-green",
    ARROW_RED: "arrow-red",
};

export const SIDEBAR_TABS = {
    DRONES: "drones",
    ALERTS: "alerts",
    HISTORY: "history",
};