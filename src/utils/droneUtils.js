// utils/droneUtils.js
/**
 * Check if drone is authorized to fly based on registration number
 * Green only if registration after the dash starts with 'B' (e.g., SD-B…)
 */
export function canFly(registration) {
    if (!registration) return false;

    const dashIndex = registration.indexOf("-");
    const firstCharAfterDash = dashIndex >= 0 && registration[dashIndex + 1]
        ? registration[dashIndex + 1].toUpperCase()
        : "";

    return firstCharAfterDash === "B";
}

/**
 * Generate unique drone ID from serial and registration
 */
export function generateDroneId(serial, registration) {
    return `${serial || "UNKNOWN"}_${registration || "NA"}`;
}

/**
 * Check if coordinates are different
 */
export function coordinatesChanged(coord1, coord2) {
    if (!coord1 || !coord2) return true;
    return coord1[0] !== coord2[0] || coord1[1] !== coord2[1];
}

/**
 * Create SVG arrow for drone icon
 */
export function createArrowSVG(color) {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24">
      <path d="M12 2l5 7h-3v8h-4V9H7l5-7z" fill="${color}"/>
    </svg>
  `;
}

/**
 * Calculate flight time in seconds
 */
export function calculateFlightTime(firstSeen) {
    if (!firstSeen) return 0;
    return Math.max(0, Math.floor((Date.now() - firstSeen) / 1000));
}