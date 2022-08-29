import { PublicESIService } from '@ionaru/esi-service';
import { IUniverseNamesDataUnit } from '@ionaru/eve-utils';

import { FilterType } from '../models/filter.model';

interface ISearchResponse extends IUniverseNamesDataUnit {
    fuzzy?: boolean;
}

interface IApiResponse {
    data: ISearchResponse;
    message: string;
    state: string;
}

export class FilterTypeService {

    private securityStatuses = [
        '-1.0',
        '-0.9',
        '-0.8',
        '-0.7',
        '-0.6',
        '-0.5',
        '-0.4',
        '-0.3',
        '-0.2',
        '-0.1',
        '0.0',
        '0.1',
        '0.2',
        '0.3',
        '0.4',
        '0.5',
        '0.6',
        '0.7',
        '0.8',
        '0.9',
        '1.0',
    ];

    private securityClasses = [
        'highsec',
        'lowsec',
        'nullsec',
        'wspace',
    ];

    private publicESIService: PublicESIService;

    public constructor(publicESIService: PublicESIService) {
        this.publicESIService = publicESIService;
    }

    public async getFilterType(filter: string): Promise<FilterType | undefined> {

        if (this.securityStatuses.includes(filter)) {
            return FilterType.SECURITY_STATUS;
        } else if (this.securityClasses.includes(filter.toLowerCase())) {
            return FilterType.SECURITY_CLASS;
        }

        const searchUrls = [
            `https://search.spaceships.app/system?q=${filter}`,
            `https://search.spaceships.app/constellation?q=${filter}`,
            `https://search.spaceships.app/region?q=${filter}`,
        ];

        const responses = await Promise.all(searchUrls.map((url) => this.publicESIService.fetchESIData<IApiResponse>(url)));
        const exactResponse = responses.filter((response) => !response.data.fuzzy)[0];

        if (exactResponse) {
            switch (exactResponse.data.category) {
                case 'region':
                    return FilterType.REGION;
                case 'constellation':
                    return FilterType.CONSTELLATION;
                case 'solar_system':
                    return FilterType.SYSTEM;
            }
        }

        return undefined;
    }
}
