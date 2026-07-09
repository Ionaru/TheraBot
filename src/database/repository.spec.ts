import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { channelRepository, ChannelType } from '../models/channel.model';
import { filterRepository, FilterType } from '../models/filter.model';
import { wormholeRepository } from '../models/wormhole.model';

import { closeDatabase, getDatabase, initDatabase } from './connection';

describe('node:sqlite data layer', () => {

    beforeEach(() => {
        initDatabase(':memory:');
    });

    afterEach(() => {
        closeDatabase();
    });

    describe('channelRepository', () => {

        it('inserts a channel and finds it by identifier, active by default with no filters', () => {
            channelRepository.insert({ identifier: 'chan-1', type: ChannelType.TEXT_CHANNEL });

            const channel = channelRepository.findByIdentifier('chan-1');

            expect(channel).toBeDefined();
            expect(channel?.identifier).toBe('chan-1');
            expect(channel?.type).toBe(ChannelType.TEXT_CHANNEL);
            expect(channel?.active).toBe(true);
            expect(channel?.filters).toStrictEqual([]);
        });

        it('returns undefined for an unknown identifier', () => {
            expect(channelRepository.findByIdentifier('does-not-exist')).toBeUndefined();
        });

        it('toggles the active flag with setActive', () => {
            channelRepository.insert({ identifier: 'chan-1', type: ChannelType.TEXT_CHANNEL });
            const channel = channelRepository.findByIdentifier('chan-1');

            channelRepository.setActive(channel!.id, false);

            expect(channelRepository.findByIdentifier('chan-1')?.active).toBe(false);
        });

        it('findActive returns only channels that are active', () => {
            channelRepository.insert({ identifier: 'active-1', type: ChannelType.TEXT_CHANNEL });
            channelRepository.insert({ identifier: 'inactive-1', type: ChannelType.DM_CHANNEL });
            const inactive = channelRepository.findByIdentifier('inactive-1');
            channelRepository.setActive(inactive!.id, false);

            const active = channelRepository.findActive();

            expect(active.map((channel) => channel.identifier)).toStrictEqual(['active-1']);
        });
    });

    describe('filterRepository', () => {

        it('inserts a filter that is eager-loaded on its channel', () => {
            channelRepository.insert({ identifier: 'chan-1', type: ChannelType.TEXT_CHANNEL });
            const channel = channelRepository.findByIdentifier('chan-1')!;

            filterRepository.insert({ channelId: channel.id, filter: 'the forge', type: FilterType.REGION });

            const reloaded = channelRepository.findByIdentifier('chan-1')!;
            expect(reloaded.filters).toHaveLength(1);
            expect(reloaded.filters[0].filter).toBe('the forge');
            expect(reloaded.filters[0].type).toBe(FilterType.REGION);
        });

        it('finds a filter by the channel identifier and filter text', () => {
            channelRepository.insert({ identifier: 'chan-1', type: ChannelType.TEXT_CHANNEL });
            const channel = channelRepository.findByIdentifier('chan-1')!;
            filterRepository.insert({ channelId: channel.id, filter: 'jita', type: FilterType.SYSTEM });

            const found = filterRepository.findByChannelIdentifierAndFilter('chan-1', 'jita');

            expect(found?.filter).toBe('jita');
            expect(filterRepository.findByChannelIdentifierAndFilter('chan-1', 'amarr')).toBeUndefined();
        });

        it('removes a filter with deleteById', () => {
            channelRepository.insert({ identifier: 'chan-1', type: ChannelType.TEXT_CHANNEL });
            const channel = channelRepository.findByIdentifier('chan-1')!;
            filterRepository.insert({ channelId: channel.id, filter: 'jita', type: FilterType.SYSTEM });
            const filter = filterRepository.findByChannelIdentifierAndFilter('chan-1', 'jita')!;

            filterRepository.deleteById(filter.id);

            expect(channelRepository.findByIdentifier('chan-1')!.filters).toStrictEqual([]);
        });

        it('cascades filter deletion when its channel is deleted', () => {
            channelRepository.insert({ identifier: 'chan-1', type: ChannelType.TEXT_CHANNEL });
            const channel = channelRepository.findByIdentifier('chan-1')!;
            filterRepository.insert({ channelId: channel.id, filter: 'jita', type: FilterType.SYSTEM });

            getDatabase().prepare('DELETE FROM channel_model WHERE id = ?').run(channel.id);

            expect(filterRepository.findByChannelIdentifierAndFilter('chan-1', 'jita')).toBeUndefined();
        });
    });

    describe('wormholeRepository', () => {

        it('inserts wormholes by explicit id, lists them, and deletes by id', () => {
            wormholeRepository.insertId(12_345);
            wormholeRepository.insertId(67_890);

            expect(wormholeRepository.findAll().map((wormhole) => wormhole.id).sort((a, b) => a - b))
                .toStrictEqual([12_345, 67_890]);

            wormholeRepository.deleteById(12_345);

            expect(wormholeRepository.findAll().map((wormhole) => wormhole.id)).toStrictEqual([67_890]);
        });

        it('ignores a duplicate id on insert', () => {
            wormholeRepository.insertId(111);
            wormholeRepository.insertId(111);

            expect(wormholeRepository.findAll()).toHaveLength(1);
        });
    });

    describe('initDatabase', () => {

        it('creates the database file directory when it does not yet exist', () => {
            const base = mkdtempSync(join(tmpdir(), 'therabot-'));
            const file = join(base, 'nested', 'therabot.db');

            try {
                initDatabase(file);
                channelRepository.insert({ identifier: 'dir-test', type: ChannelType.TEXT_CHANNEL });
                expect(channelRepository.findByIdentifier('dir-test')).toBeDefined();
            } finally {
                closeDatabase();
                rmSync(base, { force: true, recursive: true });
            }
        });
    });
});
