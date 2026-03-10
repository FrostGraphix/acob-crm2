import axios from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';
import { SiteId } from '../../../common/types/odyssey';

export interface WeatherData {
    temp: number;
    condition: string;
    icon: string;
    irradiance: number; // Estimated based on cloud cover
}

const SITE_COORDINATES: Record<SiteId, { lat: number; lon: number }> = {
    KYAKALE: { lat: 8.5, lon: 7.5 },
    MUSHA: { lat: 8.6, lon: 7.6 },
    UMAISHA: { lat: 8.5, lon: 7.0 },
    TUNGA: { lat: 9.0, lon: 6.0 },
    OGUFA: { lat: 8.0, lon: 5.0 },
};

const WEATHER_CACHE = new Map<SiteId, { data: WeatherData; expires: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export class WeatherService {
    static async getWeather(siteId: SiteId): Promise<WeatherData> {
        const cached = WEATHER_CACHE.get(siteId);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }

        try {
            if (!config.weather.apiKey) {
                throw new Error('Missing Weather API Key');
            }

            const coords = SITE_COORDINATES[siteId];
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${config.weather.apiKey}&units=metric`;
            const res = await axios.get(url);

            const condition = res.data.weather[0].main;
            const clouds = res.data.clouds.all; // 0-100

            // Basic irradiance estimation: Max ~1000 W/m2 at noon, reduced by cloud cover
            // For a truly high-fidelity dashboard, we'd use local time to calculate sun angle, 
            // but a simple cloud-based reduction works well for real-time visualization.
            const baseIrradiance = 800; // Average daytime peak
            const irradiance = Math.round(baseIrradiance * (1 - clouds / 100));

            const data: WeatherData = {
                temp: Math.round(res.data.main.temp),
                condition: condition,
                icon: res.data.weather[0].icon,
                irradiance: irradiance,
            };

            WEATHER_CACHE.set(siteId, { data, expires: Date.now() + CACHE_TTL });
            return data;
        } catch (err) {
            if (config.weather.apiKey) {
                logger.warn(`[WEATHER] Failed to fetch live weather for ${siteId}`, { error: (err as Error).message });
            }
            return this.getMockWeather(siteId);
        }
    }

    private static getMockWeather(siteId: SiteId): WeatherData {
        // Generate realistic tropical weather (Nigeria is usually warm)
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;

        // Cyclic temperatures (22C at night, 32C during day)
        const baseTemp = 27;
        const variation = isDay ? Math.sin((hour - 6) * Math.PI / 12) * 5 : -Math.sin((hour + 6) * Math.PI / 12) * 5;

        // Irradiance (Peak at noon)
        let irradiance = 0;
        if (isDay) {
            irradiance = Math.round(Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 900));
        }

        return {
            temp: Math.round(baseTemp + variation + (Math.random() * 2 - 1)),
            condition: isDay ? (Math.random() > 0.8 ? 'Cloudy' : 'Sunny') : 'Clear',
            icon: isDay ? '01d' : '01n',
            irradiance: irradiance,
        };
    }
}
