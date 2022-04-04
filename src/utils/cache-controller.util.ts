import { CacheController } from '@ionaru/esi-service';

import { debug } from '../debug';

let cacheController: CacheController;

export const getCacheController = (): CacheController => {
    if (!cacheController) {
        debug('Creating CacheController');
        cacheController = new CacheController('data/cache.json', undefined, debug);
    }

    return cacheController;
};
