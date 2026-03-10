import { SiteId, SiteMetadata } from '../../../common/types/odyssey';

export interface SiteHardware {
    pvCapacityKw: number;
    batteryCapacityKwh: number;
    inverterCapacityKw: number;
}

const REGISTRY: Record<SiteId, SiteHardware> = {
    KYAKALE: {
        pvCapacityKw: 100.5,
        batteryCapacityKwh: 215.0,
        inverterCapacityKw: 120.0,
    },
    MUSHA: {
        pvCapacityKw: 150.2,
        batteryCapacityKwh: 307.2,
        inverterCapacityKw: 180.0,
    },
    UMAISHA: {
        pvCapacityKw: 190.4,
        batteryCapacityKwh: 921.6, // Higher storage for Umaisha as per reference image
        inverterCapacityKw: 250.0,
    },
    TUNGA: {
        pvCapacityKw: 80.8,
        batteryCapacityKwh: 153.6,
        inverterCapacityKw: 100.0,
    },
    OGUFA: {
        pvCapacityKw: 120.6,
        batteryCapacityKwh: 268.8,
        inverterCapacityKw: 150.0,
    },
};

export class SiteRegistry {
    static getSiteHardware(siteId: SiteId): SiteHardware {
        return REGISTRY[siteId] || {
            pvCapacityKw: 0,
            batteryCapacityKwh: 0,
            inverterCapacityKw: 0,
        };
    }

    static getAllSiteIds(): SiteId[] {
        return Object.keys(REGISTRY) as SiteId[];
    }
}
