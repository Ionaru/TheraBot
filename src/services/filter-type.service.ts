import { EVE, ISearchData } from '@ionaru/eve-utils';

import { publicESIService } from '../main';
import { FilterType } from '../models/filter.model';

export class FilterTypeService {

    public static securityStatuses = [
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

    public static securityClasses = [
        'highsec',
        'lowsec',
        'nullsec',
        'wspace',
    ];

    public static async getFilterType(filter: string): Promise<FilterType | undefined> {

        if (FilterTypeService.securityStatuses.includes(filter)) {
            return FilterType.SecurityStatus;
        } else if (FilterTypeService.securityClasses.includes(filter.toLowerCase())) {
            return FilterType.SecurityClass;
        }

        // Search for the input in ESI
        const url = EVE.getSearchUrl(filter, ['solar_system', 'constellation', 'region']);
        const response = await publicESIService.fetchESIData<ISearchData>(url).catch(() => undefined);

        if (response) {
            if (response.region) {
                return FilterType.Region;
            } else if (response.constellation) {
                return FilterType.Constellation;
            } else if (response.solar_system) {
                return FilterType.System;
            }
        }

        return;
    }
}
