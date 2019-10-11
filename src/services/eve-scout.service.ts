import { axiosInstance, debug } from '../main';

export interface IRegion {
    id: number;
    name: string;
}

export interface ISolarSystem {
    id: number;
    name: string;
    constellationID: number;
    security: number;
    regionId: number;
    region: IRegion;
}

export interface IWormholeType {
    id: number;
    name: string;
    src: string;
    dest: string;
    lifetime: number;
    jumpMass: number;
    maxMass: number;
}

export interface IWormholeData {
    id: number;
    signatureId: string;
    type: string;
    status: string;
    wormholeMass: string;
    wormholeEol: string;
    wormholeEstimatedEol: string;
    wormholeDestinationSignatureId: string;
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
    statusUpdatedAt?: string;
    createdBy: string;
    createdById: string;
    deletedBy?: string;
    deletedById?: string;
    wormholeSourceWormholeTypeId: number;
    wormholeDestinationWormholeTypeId: number;
    solarSystemId: number;
    wormholeDestinationSolarSystemId: number;
    sourceWormholeType: IWormholeType;
    destinationWormholeType: IWormholeType;
    sourceSolarSystem: ISolarSystem;
    destinationSolarSystem: ISolarSystem;
}

export class EveScoutService {

    private debug = debug.extend('EveScoutService');

    public async getWH(secondAttempt = false): Promise<IWormholeData[] | undefined> {
        this.debug('getWH');
        const response = await axiosInstance.get<IWormholeData[]>('https://www.eve-scout.com/api/wormholes').catch(() => undefined);

        if (!response) {
            if (!secondAttempt) {
                return this.getWH(true);
            }

            return;
        }

        this.debug(`${response.data.length} wormholes`);
        return response.data;
    }
}
