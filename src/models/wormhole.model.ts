import { getDatabase } from '../database/connection';

export interface Wormhole {
    id: number;
}

export const wormholeRepository = {

    deleteById: (id: number): void => {
        getDatabase().prepare('DELETE FROM "wormhole_model" WHERE "id" = ?').run(id);
    },

    findAll: (): Wormhole[] => {
        const rows = getDatabase().prepare('SELECT "id" FROM "wormhole_model"').all();
        return rows.map((row) => ({ id: Number(row.id) }));
    },

    insertId: (id: number): void => {
        getDatabase().prepare('INSERT OR IGNORE INTO "wormhole_model" ("id") VALUES (?)').run(id);
    },
};
