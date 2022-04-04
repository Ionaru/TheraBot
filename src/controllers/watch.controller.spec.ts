/* eslint-disable jest/prefer-lowercase-title */
/* eslint-disable jest/no-mocks-import */
import { PublicESIService } from '@ionaru/esi-service';
import { EVE } from '@ionaru/eve-utils';
import { AxiosResponse } from 'axios';
import { Client, TextChannel } from 'discord.js';
import { createConnection, getConnection, getConnectionOptions } from 'typeorm';

import mockAxios from '../__mocks__/axios';
import * as wormholeJita from '../__mocks__/wormhole-jita.json';
import * as wormholeNull from '../__mocks__/wormhole-null.json';
import * as wormholeWH from '../__mocks__/wormhole-wh.json';
import * as wormholes from '../__mocks__/wormholes-all.json';
import { ChannelModel, ChannelType } from '../models/channel.model';
import { FilterModel, FilterType } from '../models/filter.model';

import { WatchController } from './watch.controller';

describe('WatchController', () => {

    describe('Notification filtering', () => {

        let client: Client;
        let channel: TextChannel;
        let channelModel: ChannelModel;
        const channelSendMock = jest.fn().mockReturnValue(new Promise(() => { /* empty */ }));
        let watchController: WatchController;

        const axiosGetMock = (returnValue: AxiosResponse) => {
            const validateStatusFunction = mockAxios.get.mock.calls[0][1].validateStatus;
            if (validateStatusFunction(returnValue.status)) {
                return returnValue;
            }

            // This would normally be an Axios error.
            throw new Error('HTTP Error');
        };

        beforeEach(async () => {
            jest.useFakeTimers();
            const connectionOptions = await getConnectionOptions();

            Object.assign(connectionOptions, {entities: [ChannelModel, FilterModel]});
            Object.assign(connectionOptions, {database: ':memory:'});
            Object.assign(connectionOptions, {type: 'sqlite'});
            Object.assign(connectionOptions, {dropSchema: true});
            Object.assign(connectionOptions, {synchronize: true});
            Object.assign(connectionOptions, {logging: false});

            await createConnection(connectionOptions);

            client = new Client({intents: []});
            channel = ({
                id: 'test_channel',
            }) as TextChannel;
            channel.send = channelSendMock;
            channelModel = await new ChannelModel(ChannelType.TEXT_CHANNEL, channel.id).save();

            const publicESIService = new PublicESIService({
                axiosInstance: mockAxios as any,
            });

            watchController = new WatchController(client, mockAxios as any, publicESIService);
        });

        afterEach(() => {
            mockAxios.get.mockReset();
            channelSendMock.mockClear();
            const conn = getConnection();
            return conn.close();
        });

        it('No filters', async () => {

            expect.assertions(1);

            for (const wormhole of wormholes) {
                await watchController.sendWormholeAddedMessage([channel], wormhole as any);
            }
            expect(channelSendMock.mock.calls).toHaveLength(wormholes.length);
        });

        it.each([
            ['highsec', FilterType.SECURITY_CLASS, 9],
            ['lowsec', FilterType.SECURITY_CLASS, 11],
            ['nullsec', FilterType.SECURITY_CLASS, 10],
            ['wspace', FilterType.SECURITY_CLASS, 6],

            ['-1.0', FilterType.SECURITY_STATUS, 6],
            ['-0.9', FilterType.SECURITY_STATUS, 1],
            ['-0.8', FilterType.SECURITY_STATUS, 0],
            ['-0.7', FilterType.SECURITY_STATUS, 0],
            ['-0.6', FilterType.SECURITY_STATUS, 0],
            ['-0.5', FilterType.SECURITY_STATUS, 0],
            ['-0.4', FilterType.SECURITY_STATUS, 2],
            ['-0.3', FilterType.SECURITY_STATUS, 6],
            ['-0.2', FilterType.SECURITY_STATUS, 1],
            ['-0.1', FilterType.SECURITY_STATUS, 0],
            ['0.0', FilterType.SECURITY_STATUS, 0],
            ['0.1', FilterType.SECURITY_STATUS, 4],
            ['0.2', FilterType.SECURITY_STATUS, 3],
            ['0.3', FilterType.SECURITY_STATUS, 3],
            ['0.4', FilterType.SECURITY_STATUS, 1],
            ['0.5', FilterType.SECURITY_STATUS, 2],
            ['0.6', FilterType.SECURITY_STATUS, 1],
            ['0.7', FilterType.SECURITY_STATUS, 3],
            ['0.8', FilterType.SECURITY_STATUS, 1],
            ['0.9', FilterType.SECURITY_STATUS, 2],
            ['1.0', FilterType.SECURITY_STATUS, 0],
        ])('Filter security (%p)', async (filter, filterType, expectedWormholes) => {

            expect.assertions(1);

            const filterModel = await new FilterModel(channelModel, filterType as number, filter as string).save();
            channelModel.filters = [filterModel];
            await channelModel.save();

            for (const wormhole of wormholes) {
                await watchController.sendWormholeAddedMessage([channel], wormhole as any);
            }
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholes);
        });

        it.each([
            ['highsec', FilterType.SECURITY_CLASS, 1],
            ['lowsec', FilterType.SECURITY_CLASS, 0],
            ['nullsec', FilterType.SECURITY_CLASS, 0],
            ['wspace', FilterType.SECURITY_CLASS, 0],

            ['1.0', FilterType.SECURITY_STATUS, 0],
            ['0.9', FilterType.SECURITY_STATUS, 1],
            ['0.8', FilterType.SECURITY_STATUS, 0],
            ['-0.9', FilterType.SECURITY_STATUS, 0],

            ['jita', FilterType.SYSTEM, 1],
            ['amarr', FilterType.SYSTEM, 0],

            ['kimotoro', FilterType.CONSTELLATION, 1],
            ['throne worlds', FilterType.CONSTELLATION, 0],

            ['the forge', FilterType.REGION, 1],
            ['domain', FilterType.REGION, 0],
        ])('Filter singular (%p)', async (securityFilter, filterType, expectedWormholes) => {

            expect.assertions(1);

            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: EVE.getUniverseTypeUrl(wormholeJita.destinationSolarSystem.constellationID)},
                data: {
                    name: 'Kimotoro',
                },
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            channelModel.filters = [
                await new FilterModel(channelModel, filterType as FilterType, securityFilter as string).save(),
            ];
            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholes);
        });

        it.each([
            ['highsec', 'jita', FilterType.SECURITY_CLASS, 1],
            ['lowsec', 'jita', FilterType.SECURITY_CLASS, 0],
            ['nullsec', 'jita', FilterType.SECURITY_CLASS, 0],
            ['wspace', 'jita', FilterType.SECURITY_CLASS, 0],

            ['1.0', 'jita', FilterType.SECURITY_STATUS, 0],
            ['0.9', 'jita', FilterType.SECURITY_STATUS, 1],
            ['0.8', 'jita', FilterType.SECURITY_STATUS, 0],
            ['-0.9', 'jita', FilterType.SECURITY_STATUS, 0],

            ['highsec', 'amarr', FilterType.SECURITY_CLASS, 0],
            ['0.9', 'amarr', FilterType.SECURITY_STATUS, 0],
        ])('Filter security and system (%p, %p)', async (securityFilter, systemFilter, filterType, expectedWormholes) => {

            expect.assertions(1);

            channelModel.filters = [
                await new FilterModel(channelModel, filterType as FilterType, securityFilter as string).save(),
                await new FilterModel(channelModel, FilterType.SYSTEM, systemFilter as string).save(),
            ];
            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholes);
        });

        it.each([
            ['highsec', 'kimotoro', FilterType.SECURITY_CLASS, 1],
            ['lowsec', 'kimotoro', FilterType.SECURITY_CLASS, 0],
            ['nullsec', 'kimotoro', FilterType.SECURITY_CLASS, 0],
            ['wspace', 'kimotoro', FilterType.SECURITY_CLASS, 0],

            ['1.0', 'kimotoro', FilterType.SECURITY_STATUS, 0],
            ['0.9', 'kimotoro', FilterType.SECURITY_STATUS, 1],
            ['0.8', 'kimotoro', FilterType.SECURITY_STATUS, 0],
            ['-0.9', 'kimotoro', FilterType.SECURITY_STATUS, 0],

            ['highsec', 'throne worlds', FilterType.SECURITY_CLASS, 0],
            ['0.9', 'throne worlds', FilterType.SECURITY_STATUS, 0],
        ])('Filter security and constellation (%p, %p)', async (securityFilter, constellationFilter, filterType, expectedWormholes) => {

            expect.assertions(1);

            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: EVE.getUniverseTypeUrl(wormholeJita.destinationSolarSystem.constellationID)},
                data: {
                    name: 'Kimotoro',
                },
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            channelModel.filters = [
                await new FilterModel(channelModel, filterType as FilterType, securityFilter as string).save(),
                await new FilterModel(channelModel, FilterType.CONSTELLATION, constellationFilter as string).save(),
            ];
            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholes);
        });

        it.each([
            ['highsec', 'the forge', FilterType.SECURITY_CLASS, 1],
            ['lowsec', 'the forge', FilterType.SECURITY_CLASS, 0],
            ['nullsec', 'the forge', FilterType.SECURITY_CLASS, 0],
            ['wspace', 'the forge', FilterType.SECURITY_CLASS, 0],

            ['1.0', 'the forge', FilterType.SECURITY_STATUS, 0],
            ['0.9', 'the forge', FilterType.SECURITY_STATUS, 1],
            ['0.8', 'the forge', FilterType.SECURITY_STATUS, 0],
            ['-0.9', 'the forge', FilterType.SECURITY_STATUS, 0],

            ['highsec', 'domain', FilterType.SECURITY_CLASS, 0],
            ['0.9', 'domain', FilterType.SECURITY_STATUS, 0],
        ])('Filter security and region (%p, %p)', async (securityFilter, regionFilter, filterType, expectedWormholes) => {

            expect.assertions(1);

            channelModel.filters = [
                await new FilterModel(channelModel, filterType as FilterType, securityFilter as string).save(),
                await new FilterModel(channelModel, FilterType.REGION, regionFilter as string).save(),
            ];
            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholes);
        });

        it.each([
            [[['1.0', FilterType.SECURITY_STATUS], ['0.9', FilterType.SECURITY_STATUS]], 1, 0, 0],
            [[['0.0', FilterType.SECURITY_STATUS], ['0.9', FilterType.SECURITY_STATUS]], 1, 0, 0],
            [[['1.0', FilterType.SECURITY_STATUS], ['0.8', FilterType.SECURITY_STATUS]], 0, 0, 0],
            [[['-1.0', FilterType.SECURITY_STATUS], ['0.8', FilterType.SECURITY_STATUS]], 0, 1, 1],
            [[['0.9', FilterType.SECURITY_STATUS], ['-1.0', FilterType.SECURITY_STATUS]], 1, 1, 1],

            [[['1.0', FilterType.SECURITY_STATUS], ['wspace', FilterType.SECURITY_CLASS]], 0, 1, 0],
            [[['-1.0', FilterType.SECURITY_STATUS], ['wspace', FilterType.SECURITY_CLASS]], 0, 1, 1],
            [[['-1.0', FilterType.SECURITY_STATUS], ['highsec', FilterType.SECURITY_CLASS]], 1, 1, 1],
            [[['1.0', FilterType.SECURITY_STATUS], ['highsec', FilterType.SECURITY_CLASS]], 1, 0, 0],
            [[['0.9', FilterType.SECURITY_STATUS], ['highsec', FilterType.SECURITY_CLASS]], 1, 0, 0],

            [[['highsec', FilterType.SECURITY_CLASS], ['wspace', FilterType.SECURITY_CLASS]], 1, 1, 0],
            [[['lowsec', FilterType.SECURITY_CLASS], ['wspace', FilterType.SECURITY_CLASS]], 0, 1, 0],
            [[['nullsec', FilterType.SECURITY_CLASS], ['highsec', FilterType.SECURITY_CLASS]], 1, 0, 1],

            [[['jita', FilterType.SYSTEM], ['amarr', FilterType.SYSTEM]], 1, 0, 0],
            [[['the forge', FilterType.REGION], ['amarr', FilterType.SYSTEM]], 1, 0, 0],
            [[['kimotoro', FilterType.CONSTELLATION], ['amarr', FilterType.SYSTEM]], 1, 0, 0],

            [[['kimotoro', FilterType.CONSTELLATION], ['wspace', FilterType.SECURITY_CLASS]], 0, 1, 0],
            [[['kimotoro', FilterType.CONSTELLATION], ['highsec', FilterType.SECURITY_CLASS]], 1, 0, 0],
        ])('Filter combinations (%j)', async (
            filterData, expectedWormholesJita, expectedWormholesWH, expectedWormholesNull,
        ) => {

            expect.assertions(3);

            mockAxios.get.mockImplementationOnce(async () => axiosGetMock({
                config: {url: EVE.getUniverseTypeUrl(wormholeJita.destinationSolarSystem.constellationID)},
                data: {
                    name: 'Kimotoro',
                },
                headers: {},
                status: 200,
                statusText: 'OK',
            }));

            channelModel.filters = [];
            for (const data of filterData as any) {
                const filter = await new FilterModel(channelModel, data[1] as number, data[0] as string).save();
                channelModel.filters.push(filter);
            }

            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholesJita);

            channelSendMock.mockClear();

            await watchController.sendWormholeAddedMessage([channel], wormholeWH as any);
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholesWH);

            channelSendMock.mockClear();

            await watchController.sendWormholeAddedMessage([channel], wormholeNull as any);
            expect(channelSendMock.mock.calls).toHaveLength(expectedWormholesNull);
        });
    });
});
