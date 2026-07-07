import { getDatabase } from '../database/connection';

import { Filter, filterRepository } from './filter.model';

export enum ChannelType {
    TEXT_CHANNEL,
    DM_CHANNEL,
}

export interface Channel {
    active: boolean;
    filters: Filter[];
    id: number;
    identifier: string;
    type: ChannelType;
}

const toChannel = (row: Record<string, unknown>): Channel => ({
    active: Boolean(row.active),
    filters: filterRepository.findByChannelId(Number(row.id)),
    id: Number(row.id),
    identifier: String(row.identifier),
    type: Number(row.type),
});

export const channelRepository = {

    findActive: (): Channel[] => {
        const rows = getDatabase()
            .prepare('SELECT "id", "identifier", "type", "active" FROM "channel_model" WHERE "active" = 1')
            .all();
        return rows.map((row) => toChannel(row));
    },

    findByIdentifier: (identifier: string): Channel | undefined => {
        const row = getDatabase()
            .prepare('SELECT "id", "identifier", "type", "active" FROM "channel_model" WHERE "identifier" = ?')
            .get(identifier);
        return row ? toChannel(row) : undefined;
    },

    insert: (data: { identifier: string; type: ChannelType; }): void => {
        getDatabase()
            .prepare('INSERT INTO "channel_model" ("identifier", "type", "active") VALUES (?, ?, 1)')
            .run(data.identifier, data.type);
    },

    setActive: (id: number, active: boolean): void => {
        getDatabase()
            .prepare('UPDATE "channel_model" SET "active" = ?, "updatedOn" = datetime(\'now\') WHERE "id" = ?')
            .run(active ? 1 : 0, id);
    },
};
