import { EVE, IUniverseTypeData } from '@ionaru/eve-utils';

import { debug, publicESIService } from '../main';

export class NamesService {

    private debug = debug.extend('NamesService');

    public async getName(id: number): Promise<string | undefined> {
        this.debug('getName');

        const url = EVE.getUniverseTypeUrl(id);
        const response = await publicESIService.fetchESIData<IUniverseTypeData>(url).catch(() => undefined);

        if (response) {
            return response.name;
        }

        return;
    }
}
