/* eslint-disable jest/prefer-lowercase-title */
/* eslint-disable jest/no-mocks-import */
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

    const axiosGetMock = (returnValue: AxiosResponse) => {
        const validateStatusFunction = mockAxios.get.mock.calls[0][1].validateStatus;
        if (validateStatusFunction(returnValue.status)) {
            return returnValue;
        }

        // This would normally be an Axios error.
        throw new Error('HTTP Error');
    };

    afterEach(() => {
        mockAxios.get.mockReset();
    });

    // eslint-disable-next-line jest/no-disabled-tests
    describe.skip('System', () => {

        it('Success', async () => {

            expect.assertions(1);

            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Amarr'},
                data: {solar_system: [30002187]},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            await expect(filterTypeService.getFilterType('Amarr')).resolves.toBe(FilterType.SYSTEM);
        });
    });

    // eslint-disable-next-line jest/no-disabled-tests
    describe.skip('Constellation', () => {

        it('Success', async () => {

            expect.assertions(1);

            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Kimotoro'},
                data: {constellation: [20000020]},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            await expect(filterTypeService.getFilterType('Kimotoro')).resolves.toBe(FilterType.CONSTELLATION);
        });
    });

    // eslint-disable-next-line jest/no-disabled-tests
    describe.skip('Region', () => {

        it('Success', async () => {

            expect.assertions(1);

            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Domain'},
                data: {region: [10000043]},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            await expect(filterTypeService.getFilterType('Domain')).resolves.toBe(FilterType.REGION);
        });
    });

    describe('Security', () => {

        it.each([
            '-1.0', '-0.9', '-0.8', '-0.7', '-0.6', '-0.5', '-0.4', '-0.3', '-0.2', '-0.1',
            '0.0', '0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0',
        ])('Security Status (%p)', async (filter) => {
            expect.assertions(1);
            await expect(filterTypeService.getFilterType(filter as string)).resolves.toBe(FilterType.SECURITY_STATUS);
        });

        it.each([
            'highsec', 'lowsec', 'nullsec', 'wspace',
        ])('Security Class (%p)', async (filter) => {
            expect.assertions(1);
            await expect(filterTypeService.getFilterType(filter as string)).resolves.toBe(FilterType.SECURITY_CLASS);
        });
    });

    // eslint-disable-next-line jest/no-disabled-tests
    describe.skip('Misc', () => {

        it('Empty', async () => {

            expect.assertions(1);

            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: 'https://esi.evetech.net/v2/search/?categories=solar_system,constellation,region&search=Amarr'},
                data: {},
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            await expect(filterTypeService.getFilterType('Amarr')).resolves.toBeUndefined();
        });

        it('Fail', async () => {

            expect.assertions(1);

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

            await expect(filterTypeService.getFilterType('Amarr')).resolves.toBeUndefined();
        });
    });
});
