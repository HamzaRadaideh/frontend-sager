// hooks/useFlightTime.js
import { useState, useEffect } from "react";
import { calculateFlightTime, formatFlightTime } from "../utils/droneUtils";

export function useFlightTime(firstSeen) {
    const [flightTime, setFlightTime] = useState("");

    useEffect(() => {
        const updateFlightTime = () => {
            const seconds = calculateFlightTime(firstSeen);
            setFlightTime(formatFlightTime(seconds));
        };

        // Update immediately
        updateFlightTime();

        // Update every second
        const interval = setInterval(updateFlightTime, 1000);

        return () => clearInterval(interval);
    }, [firstSeen]);

    return flightTime;
}