// utils/formatters.js
/**
 * Format flight time from seconds to MM:SS format
 */
export function formatFlightTime(seconds) {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
}

/**
 * Format altitude with unit
 */
export function formatAltitude(altitude) {
    return altitude !== null && altitude !== undefined
        ? `${altitude} m`
        : "- m";
}

/**
 * Truncate text to specified length
 */
export function truncateText(text, maxLength = 20) {
    if (!text) return "";
    return text.length > maxLength
        ? `${text.substring(0, maxLength)}...`
        : text;
}