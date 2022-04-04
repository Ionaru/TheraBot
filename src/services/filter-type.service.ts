import { PublicESIService } from '@ionaru/esi-service';
import { EVE, ISearchData, SearchCategory } from '@ionaru/eve-utils';

import { FilterType } from '../models/filter.model';

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
            return FilterType.SecurityStatus;
        } else if (this.securityClasses.includes(filter.toLowerCase())) {
            return FilterType.SecurityClass;
        }

        // Search for the input in ESI
        const url = EVE.getSearchUrl(filter, [
            SearchCategory.SOLAR_SYSTEM, SearchCategory.CONSTELLATION, SearchCategory.REGION,
        ]);
        const response = await this.publicESIService.fetchESIData<ISearchData>(url).catch(() => undefined);

        if (response) {
            if (response.region) {
                return FilterType.Region;
            } else if (response.constellation) {
                return FilterType.Constellation;
            } else if (response.solar_system) {
                return FilterType.System;
            }
        }

        return undefined;
    }
}
