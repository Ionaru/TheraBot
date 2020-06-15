/* tslint:disable:no-big-function no-duplicate-string */
import { PublicESIService } from '@ionaru/esi-service';
import { EVE } from '@ionaru/eve-utils';
import { AxiosResponse } from 'axios';
import { Client, Guild, TextChannel } from 'discord.js';
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

        function axiosGetMock(returnValue: AxiosResponse) {
            const validateStatusFunction = mockAxios.get.mock.calls[0][1].validateStatus;
            if (validateStatusFunction(returnValue.status)) {
                return returnValue;
            }

            // This would normally be an Axios error.
            throw new Error('HTTP Error');
        }

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

            client = new Client();
            const guild = new Guild(client, {
                emojis: [],
            });
            channel = new TextChannel(guild, {
                id: 'test_channel',
            });
            channel.send = channelSendMock;
            channelModel = await new ChannelModel(ChannelType.TextChannel, channel.id).save();

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

        test('No filters', async () => {

            for (const wormhole of wormholes) {
                await watchController.sendWormholeAddedMessage([channel], wormhole as any);
            }
            expect(channelSendMock.mock.calls.length).toBe(wormholes.length);
        });

        test.each([
            ['highsec', FilterType.SecurityClass, 9],
            ['lowsec', FilterType.SecurityClass, 11],
            ['nullsec', FilterType.SecurityClass, 10],
            ['wspace', FilterType.SecurityClass, 6],

            ['-1.0', FilterType.SecurityStatus, 6],
            ['-0.9', FilterType.SecurityStatus, 1],
            ['-0.8', FilterType.SecurityStatus, 0],
            ['-0.7', FilterType.SecurityStatus, 0],
            ['-0.6', FilterType.SecurityStatus, 0],
            ['-0.5', FilterType.SecurityStatus, 0],
            ['-0.4', FilterType.SecurityStatus, 2],
            ['-0.3', FilterType.SecurityStatus, 6],
            ['-0.2', FilterType.SecurityStatus, 1],
            ['-0.1', FilterType.SecurityStatus, 0],
            ['0.0', FilterType.SecurityStatus, 0],
            ['0.1', FilterType.SecurityStatus, 4],
            ['0.2', FilterType.SecurityStatus, 3],
            ['0.3', FilterType.SecurityStatus, 3],
            ['0.4', FilterType.SecurityStatus, 1],
            ['0.5', FilterType.SecurityStatus, 2],
            ['0.6', FilterType.SecurityStatus, 1],
            ['0.7', FilterType.SecurityStatus, 3],
            ['0.8', FilterType.SecurityStatus, 1],
            ['0.9', FilterType.SecurityStatus, 2],
            ['1.0', FilterType.SecurityStatus, 0],
        ])('Filter security (%p)', async (filter, filterType, expectedWormholes) => {

            const filterModel = await new FilterModel(channelModel, filterType as number, filter as string).save();
            channelModel.filters = [filterModel];
            await channelModel.save();

            for (const wormhole of wormholes) {
                await watchController.sendWormholeAddedMessage([channel], wormhole as any);
            }
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholes);
        });

        test.each([
            ['highsec', FilterType.SecurityClass, 1],
            ['lowsec', FilterType.SecurityClass, 0],
            ['nullsec', FilterType.SecurityClass, 0],
            ['wspace', FilterType.SecurityClass, 0],

            ['1.0', FilterType.SecurityStatus, 0],
            ['0.9', FilterType.SecurityStatus, 1],
            ['0.8', FilterType.SecurityStatus, 0],
            ['-0.9', FilterType.SecurityStatus, 0],

            ['jita', FilterType.System, 1],
            ['amarr', FilterType.System, 0],

            ['kimotoro', FilterType.Constellation, 1],
            ['throne worlds', FilterType.Constellation, 0],

            ['the forge', FilterType.Region, 1],
            ['domain', FilterType.Region, 0],
        ])('Filter singular (%p)', async (securityFilter, filterType, expectedWormholes) => {

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
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholes);
        });

        test.each([
            ['highsec', 'jita', FilterType.SecurityClass, 1],
            ['lowsec', 'jita', FilterType.SecurityClass, 0],
            ['nullsec', 'jita', FilterType.SecurityClass, 0],
            ['wspace', 'jita', FilterType.SecurityClass, 0],

            ['1.0', 'jita', FilterType.SecurityStatus, 0],
            ['0.9', 'jita', FilterType.SecurityStatus, 1],
            ['0.8', 'jita', FilterType.SecurityStatus, 0],
            ['-0.9', 'jita', FilterType.SecurityStatus, 0],

            ['highsec', 'amarr', FilterType.SecurityClass, 0],
            ['0.9', 'amarr', FilterType.SecurityStatus, 0],
        ])('Filter security and system (%p, %p)', async (securityFilter, systemFilter, filterType, expectedWormholes) => {

            channelModel.filters = [
                await new FilterModel(channelModel, filterType as FilterType, securityFilter as string).save(),
                await new FilterModel(channelModel, FilterType.System, systemFilter as string).save(),
            ];
            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholes);
        });

        test.each([
            ['highsec', 'kimotoro', FilterType.SecurityClass, 1],
            ['lowsec', 'kimotoro', FilterType.SecurityClass, 0],
            ['nullsec', 'kimotoro', FilterType.SecurityClass, 0],
            ['wspace', 'kimotoro', FilterType.SecurityClass, 0],

            ['1.0', 'kimotoro', FilterType.SecurityStatus, 0],
            ['0.9', 'kimotoro', FilterType.SecurityStatus, 1],
            ['0.8', 'kimotoro', FilterType.SecurityStatus, 0],
            ['-0.9', 'kimotoro', FilterType.SecurityStatus, 0],

            ['highsec', 'throne worlds', FilterType.SecurityClass, 0],
            ['0.9', 'throne worlds', FilterType.SecurityStatus, 0],
        ])('Filter security and constellation (%p, %p)', async (securityFilter, constellationFilter, filterType, expectedWormholes) => {

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
                await new FilterModel(channelModel, FilterType.Constellation, constellationFilter as string).save(),
            ];
            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholes);
        });

        test.each([
            ['highsec', 'the forge', FilterType.SecurityClass, 1],
            ['lowsec', 'the forge', FilterType.SecurityClass, 0],
            ['nullsec', 'the forge', FilterType.SecurityClass, 0],
            ['wspace', 'the forge', FilterType.SecurityClass, 0],

            ['1.0', 'the forge', FilterType.SecurityStatus, 0],
            ['0.9', 'the forge', FilterType.SecurityStatus, 1],
            ['0.8', 'the forge', FilterType.SecurityStatus, 0],
            ['-0.9', 'the forge', FilterType.SecurityStatus, 0],

            ['highsec', 'domain', FilterType.SecurityClass, 0],
            ['0.9', 'domain', FilterType.SecurityStatus, 0],
        ])('Filter security and region (%p, %p)', async (securityFilter, regionFilter, filterType, expectedWormholes) => {

            channelModel.filters = [
                await new FilterModel(channelModel, filterType as FilterType, securityFilter as string).save(),
                await new FilterModel(channelModel, FilterType.Region, regionFilter as string).save(),
            ];
            await channelModel.save();

            await watchController.sendWormholeAddedMessage([channel], wormholeJita as any);
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholes);
        });

        test.each([
            [[['1.0', FilterType.SecurityStatus], ['0.9', FilterType.SecurityStatus]], 1, 0, 0],
            [[['0.0', FilterType.SecurityStatus], ['0.9', FilterType.SecurityStatus]], 1, 0, 0],
            [[['1.0', FilterType.SecurityStatus], ['0.8', FilterType.SecurityStatus]], 0, 0, 0],
            [[['-1.0', FilterType.SecurityStatus], ['0.8', FilterType.SecurityStatus]], 0, 1, 1],
            [[['0.9', FilterType.SecurityStatus], ['-1.0', FilterType.SecurityStatus]], 1, 1, 1],

            [[['1.0', FilterType.SecurityStatus], ['wspace', FilterType.SecurityClass]], 0, 1, 0],
            [[['-1.0', FilterType.SecurityStatus], ['wspace', FilterType.SecurityClass]], 0, 1, 1],
            [[['-1.0', FilterType.SecurityStatus], ['highsec', FilterType.SecurityClass]], 1, 1, 1],
            [[['1.0', FilterType.SecurityStatus], ['highsec', FilterType.SecurityClass]], 1, 0, 0],
            [[['0.9', FilterType.SecurityStatus], ['highsec', FilterType.SecurityClass]], 1, 0, 0],

            [[['highsec', FilterType.SecurityClass], ['wspace', FilterType.SecurityClass]], 1, 1, 0],
            [[['lowsec', FilterType.SecurityClass], ['wspace', FilterType.SecurityClass]], 0, 1, 0],
            [[['nullsec', FilterType.SecurityClass], ['highsec', FilterType.SecurityClass]], 1, 0, 1],

            [[['jita', FilterType.System], ['amarr', FilterType.System]], 1, 0, 0],
            [[['the forge', FilterType.Region], ['amarr', FilterType.System]], 1, 0, 0],
            [[['kimotoro', FilterType.Constellation], ['amarr', FilterType.System]], 1, 0, 0],

            [[['kimotoro', FilterType.Constellation], ['wspace', FilterType.SecurityClass]], 0, 1, 0],
            [[['kimotoro', FilterType.Constellation], ['highsec', FilterType.SecurityClass]], 1, 0, 0],
        ])('Filter combinations (%j)', async (
            filterData, expectedWormholesJita, expectedWormholesWH, expectedWormholesNull,
        ) => {

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
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholesJita);

            channelSendMock.mockClear();

            await watchController.sendWormholeAddedMessage([channel], wormholeWH as any);
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholesWH);

            channelSendMock.mockClear();

            await watchController.sendWormholeAddedMessage([channel], wormholeNull as any);
            expect(channelSendMock.mock.calls.length).toBe(expectedWormholesNull);
        });
    });
});
