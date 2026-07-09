import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * Consolidated final schema (previously produced by the TypeORM migrations).
 * `CREATE TABLE IF NOT EXISTS` makes this a no-op against an already-migrated
 * `therabot.db` and creates the schema from scratch on a fresh database.
 */
const schema = `
    CREATE TABLE IF NOT EXISTS "channel_model" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "createdOn" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedOn" datetime NOT NULL DEFAULT (datetime('now')),
        "identifier" varchar NOT NULL,
        "type" integer NOT NULL,
        "active" boolean NOT NULL,
        CONSTRAINT "UQ_channel_model_identifier" UNIQUE ("identifier")
    );
    CREATE TABLE IF NOT EXISTS "filter_model" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "createdOn" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedOn" datetime NOT NULL DEFAULT (datetime('now')),
        "type" integer NOT NULL,
        "filter" varchar NOT NULL,
        "channelId" integer,
        CONSTRAINT "UQ_filter_model_filter_channelId" UNIQUE ("filter", "channelId"),
        CONSTRAINT "FK_filter_model_channelId" FOREIGN KEY ("channelId")
            REFERENCES "channel_model" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
    );
    CREATE TABLE IF NOT EXISTS "wormhole_model" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "createdOn" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedOn" datetime NOT NULL DEFAULT (datetime('now'))
    );
`;

let database: DatabaseSync | undefined;

export const initDatabase = (path = 'data/therabot.db'): DatabaseSync => {
    // node:sqlite will not create missing parent directories, so ensure they exist.
    if (path !== ':memory:') {
        mkdirSync(dirname(path), { recursive: true });
    }
    database = new DatabaseSync(path);
    // node:sqlite does not enable foreign keys by default; required for ON DELETE CASCADE.
    database.exec('PRAGMA foreign_keys = ON');
    database.exec(schema);
    return database;
};

export const getDatabase = (): DatabaseSync => {
    if (!database) {
        throw new Error('Database has not been initialized, call initDatabase() first.');
    }
    return database;
};

export const closeDatabase = (): void => {
    database?.close();
    database = undefined;
};
