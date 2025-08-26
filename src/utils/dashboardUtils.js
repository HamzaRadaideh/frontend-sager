// utils/dashboardUtils.js
export const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
};

export const calculateStats = (drones) => {
    const droneList = Object.values(drones);
    const activeDrones = droneList.filter(d => d.color === '#22c55e').length;
    const totalDrones = droneList.length;
    const totalFlightTime = droneList.reduce((acc, d) => acc + (Date.now() - d.firstSeen), 0);
    const avgFlightTime = totalFlightTime / totalDrones;

    return {
        activeDrones,
        totalDrones,
        totalFlightTime: totalFlightTime / 1000,
        avgFlightTime: avgFlightTime / 1000,
        efficiency: Math.round((activeDrones / totalDrones) * 100)
    };
};

export const generateChartData = (drones, stats) => {
    const droneList = Object.values(drones);

    // Flight time distribution
    const flightTimeData = droneList.map(drone => ({
        name: drone.props.Name.slice(0, 10),
        flightTime: Math.round((Date.now() - drone.firstSeen) / 60000),
        status: drone.color === '#22c55e' ? 'Flying' : 'Landed'
    }));

    // Activity over time (last 6 hours)
    const activityData = [];
    for (let i = 5; i >= 0; i--) {
        const hour = new Date();
        hour.setHours(hour.getHours() - i);
        const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false });

        activityData.push({
            time: hourStr,
            active: Math.floor(Math.random() * stats.activeDrones) + Math.max(1, stats.activeDrones - 2),
            total: stats.totalDrones
        });
    }

    // Status distribution
    const statusData = [
        { name: 'Flying', value: stats.activeDrones, color: '#22c55e' },
        { name: 'Landed', value: stats.totalDrones - stats.activeDrones, color: '#ef4444' }
    ];

    // Pilot distribution
    const pilotStats = {};
    droneList.forEach(drone => {
        const pilot = drone.props.pilot;
        if (!pilotStats[pilot]) {
            pilotStats[pilot] = { flying: 0, total: 0 };
        }
        pilotStats[pilot].total++;
        if (drone.color === '#22c55e') {
            pilotStats[pilot].flying++;
        }
    });

    const pilotData = Object.entries(pilotStats).map(([pilot, stats]) => ({
        pilot,
        flying: stats.flying,
        landed: stats.total - stats.flying,
        total: stats.total
    }));

    return { flightTimeData, activityData, statusData, pilotData };
};