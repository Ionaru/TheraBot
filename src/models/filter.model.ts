import { getDatabase } from '../database/connection';

export enum FilterType {
    SECURITY_STATUS,
    SECURITY_CLASS,
    SYSTEM,
    CONSTELLATION,
    REGION,
}

export interface Filter {
    channelId: number;
    filter: string;
    id: number;
    type: FilterType;
}

const toFilter = (row: Record<string, unknown>): Filter => ({
    channelId: Number(row.channelId),
    filter: String(row.filter),
    id: Number(row.id),
    type: Number(row.type),
});

export const filterRepository = {

    deleteById: (id: number): void => {
        getDatabase().prepare('DELETE FROM "filter_model" WHERE "id" = ?').run(id);
    },

    findByChannelId: (channelId: number): Filter[] => {
        const rows = getDatabase()
            .prepare('SELECT "id", "type", "filter", "channelId" FROM "filter_model" WHERE "channelId" = ?')
            .all(channelId);
        return rows.map((row) => toFilter(row));
    },

    findByChannelIdentifierAndFilter: (identifier: string, filter: string): Filter | undefined => {
        const row = getDatabase().prepare(
            'SELECT "f"."id", "f"."type", "f"."filter", "f"."channelId" ' +
            'FROM "filter_model" "f" ' +
            'INNER JOIN "channel_model" "c" ON "f"."channelId" = "c"."id" ' +
            'WHERE "c"."identifier" = ? AND "f"."filter" = ?',
        ).get(identifier, filter);
        return row ? toFilter(row) : undefined;
    },

    insert: (data: { channelId: number; filter: string; type: FilterType; }): void => {
        getDatabase()
            .prepare('INSERT INTO "filter_model" ("channelId", "type", "filter") VALUES (?, ?, ?)')
            .run(data.channelId, data.type, data.filter);
    },
};
