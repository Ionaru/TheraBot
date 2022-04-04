import { PublicESIService } from '@ionaru/esi-service';

import { debug } from '../debug';

import { getAxiosInstance } from './axios-instance.util';
import { getCacheController } from './cache-controller.util';

let publicESIService: PublicESIService;

export const getPublicESIService = (): PublicESIService => {
    if (!publicESIService) {
        debug('Creating PublicESIService');
        publicESIService = new PublicESIService({
            axiosInstance: getAxiosInstance(),
            cacheController: getCacheController(),
            debug,
        });
    }

    return publicESIService;
};
