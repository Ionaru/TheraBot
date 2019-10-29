/* tslint:disable:no-big-function no-duplicate-string */
import { PublicESIService } from '@ionaru/esi-service';
import { AxiosResponse } from 'axios';

import mockAxios from '../__mocks__/axios';
import { FilterType } from '../models/filter.model';
import { FilterTypeService } from './filter-type.service';

describe('FilterTypeService', () => {

    const publicESIService = new PublicESIService({
        axiosInstance: mockAxios as any,
    });
    const filterTypeService = new FilterTypeService(publicESIService);

    function axiosGetMock(returnValue: AxiosResponse) {
        const validateStatusFunction = mockAxios.get.mock.calls[0][1].validateStatus;
        if (validateStatusFunction(returnValue.status)) {
            return returnValue;
        }

        // This would normally be an Axios error.
        throw new Error('HTTP Error');
    }

    afterEach(() => {
        mockAxios.get.mockReset();
    });

    describe('System', () => {

        test('Success', async () => {
            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Amarr'},
                data: {solar_system: [30002187]},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            expect(await filterTypeService.getFilterType('Amarr')).toBe(FilterType.System);
        });
    });

    describe('Constellation', () => {

        test('Success', async () => {
            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Kimotoro'},
                data: {constellation: [20000020]},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            expect(await filterTypeService.getFilterType('Kimotoro')).toBe(FilterType.Constellation);
        });
    });

    describe('Region', () => {

        test('Success', async () => {
            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Domain'},
                data: {region: [10000043]},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            expect(await filterTypeService.getFilterType('Domain')).toBe(FilterType.Region);
        });
    });

    describe('Security', () => {

        test.each([
            '-1.0', '-0.9', '-0.8', '-0.7', '-0.6', '-0.5', '-0.4', '-0.3', '-0.2', '-0.1',
            '0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0',
        ])('Security Status (%p)', async (filter) => {
            expect(await filterTypeService.getFilterType(filter as string)).toBe(FilterType.SecurityStatus);
        });

        test.each([
            'highsec', 'lowsec', 'nullsec', 'wspace',
        ])('Security Class (%p)', async (filter) => {
            expect(await filterTypeService.getFilterType(filter as string)).toBe(FilterType.SecurityClass);
        });
    });

    describe('Misc', () => {

        test('Empty', async () => {
            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Amarr'},
                data: {},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            expect(await filterTypeService.getFilterType('Amarr')).toBe(undefined);
        });

        test('Fail', async () => {
            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Amarr'},
                data: {
                    solar_system: [
                        30002187,
                    ],
                },
                headers: {},
                status: 500,
                statusText: 'OK',
            }));

            expect(await filterTypeService.getFilterType('Amarr')).toBe(undefined);
        });
    });
});
