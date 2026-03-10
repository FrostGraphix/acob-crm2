import { SiteId, FlowMetrics, GenerationStats, DashboardData } from '../../../common/types/odyssey';
import { SiteRegistry } from './site-registry';
import { WeatherService } from './weather-service';
import { logger } from '../config/logger';

export class SynthesisEngine {
    /**
     * Generates a 24-hour power profile for a site based on daily energy totals.
     * Returns data points for each hour.
     */
    static async getPowerProfile(siteId: SiteId, dailyKwh: number) {
        const hardware = SiteRegistry.getSiteHardware(siteId);
        const weather = await WeatherService.getWeather(siteId);

        const profile = [];
        let currentSoc = 75; // Starting point for simulation

        for (let hour = 0; hour < 24; hour++) {
            // 1. PV Generation (Bell curve peak at 12:00)
            // Standard Gaussian: f(x) = a * exp(-(x-b)^2 / (2c^2))
            const pvPeak = (dailyKwh * 0.6) / 5; // Rough estimate of peak kw from daily kwh
            const pvKw = hour >= 6 && hour <= 18
                ? Math.max(0, pvPeak * Math.exp(-Math.pow(hour - 12, 2) / (2 * Math.pow(2.5, 2))))
                : 0;

            // 2. Load Consumption (Bimodal peak at 7:00 and 20:00)
            const loadAvg = dailyKwh / 24;
            const morningPeak = Math.exp(-Math.pow(hour - 7, 2) / (2 * Math.pow(1.5, 2))) * (loadAvg * 1.5);
            const eveningPeak = Math.exp(-Math.pow(hour - 20, 2) / (2 * Math.pow(2, 2))) * (loadAvg * 2.5);
            const baseLoad = loadAvg * 0.4;
            const loadKw = baseLoad + morningPeak + eveningPeak;

            // 3. Battery Logic
            const netPower = pvKw - loadKw;
            let batteryPower = 0;
            let gridPower = 0;

            if (netPower > 0) {
                // Charging
                batteryPower = Math.min(netPower, hardware.inverterCapacityKw * 0.5);
                currentSoc = Math.min(100, currentSoc + (batteryPower / hardware.batteryCapacityKwh) * 100);
                gridPower = netPower - batteryPower; // Excess to grid
            } else {
                // Discharging
                const dischargeNeeded = Math.abs(netPower);
                batteryPower = -Math.min(dischargeNeeded, hardware.inverterCapacityKw * 0.8);
                currentSoc = Math.max(20, currentSoc + (batteryPower / hardware.batteryCapacityKwh) * 100);
                gridPower = dischargeNeeded + batteryPower; // Remaining from grid
            }

            profile.push({
                timestamp: `${hour.toString().padStart(2, '0')}:00`,
                pv: Math.round(pvKw * 100) / 100,
                load: Math.round(loadKw * 100) / 100,
                battery: Math.round(batteryPower * 100) / 100,
                grid: Math.round(gridPower * 100) / 100,
                soc: Math.round(currentSoc * 10) / 10,
            });
        }

        return profile;
    }

    /**
     * Derives real-time flow metrics based on current time and site state.
     */
    static async getRealTimeFlow(siteId: SiteId, currentConsumptionKw: number): Promise<FlowMetrics> {
        const hardware = SiteRegistry.getSiteHardware(siteId);
        const weather = await WeatherService.getWeather(siteId);
        const hour = new Date().getHours();

        // PV Production based on hardware capacity and irradiance
        const theoreticalMaxPvAtHour = hardware.pvCapacityKw * (weather.irradiance / 1000);
        // Add time-of-day factor
        const todFactor = hour >= 6 && hour <= 18
            ? Math.sin((hour - 6) * Math.PI / 12)
            : 0;
        const pvProduction = Math.round(theoreticalMaxPvAtHour * todFactor * 100) / 100;

        const load = currentConsumptionKw;
        const net = pvProduction - load;

        let invToBatt = 0;
        let battToInv = 0;
        let invToLoad = load;
        let gridToInv = 0;
        let invToGrid = 0;

        if (net > 0) {
            // Excess PV
            invToBatt = Math.min(net, hardware.inverterCapacityKw * 0.5);
            invToGrid = Math.max(0, net - invToBatt);
        } else {
            // Deficit
            const deficit = Math.abs(net);
            battToInv = Math.min(deficit, hardware.inverterCapacityKw * 0.5);
            gridToInv = Math.max(0, deficit - battToInv);
        }

        return {
            solarToInverterKw: pvProduction,
            inverterToBatteryKw: invToBatt,
            batteryToInverterKw: battToInv,
            inverterToLoadKw: invToLoad,
            gridToInverterKw: gridToInv,
            inverterToGridKw: invToGrid,
            generatorToInverterKw: 0, // Placeholder for future integration
        };
    }

    static async getGenerationStats(siteId: SiteId, dailyKwh: number): Promise<GenerationStats> {
        // Derived from historical ratios or simulated totals
        return {
            pvYield: Math.round(dailyKwh * 1.2 * 100) / 100,
            loadConsumption: dailyKwh,
            gridImport: Math.round(dailyKwh * 0.15 * 100) / 100,
            gridExport: Math.round(dailyKwh * 0.05 * 100) / 100,
            batteryDischarge: Math.round(dailyKwh * 0.4 * 100) / 100,
            batteryCharge: Math.round(dailyKwh * 0.45 * 100) / 100,
        };
    }
}
