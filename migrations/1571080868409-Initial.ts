import { MigrationInterface, QueryRunner } from 'typeorm';

interface IBaseModelData {
    id: number;
    createdOn: string;
    updatedOn: string;
}

interface IWormholeModelData extends IBaseModelData {
    identifier: number;
}

interface IChannelModelData extends IBaseModelData {
    identifier: string;
}

// noinspection JSUnusedGlobalSymbols
export class Initial1571080868409 implements MigrationInterface {

    private static async migrateWormholeModel(queryRunner: QueryRunner) {

        // Get old data if needed
        let wormholeModelData: IWormholeModelData[] = [];
        const wormholeModelExists = await queryRunner.query(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='wormhole_model';
        `);
        if (wormholeModelExists.length) {
            wormholeModelData = await queryRunner.query(`SELECT * FROM "wormhole_model"`);
        }

        // Drop old table
        await queryRunner.query(`DROP TABLE IF EXISTS "wormhole_model"`);

        // Create table
        await queryRunner.query(`CREATE TABLE "wormhole_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" integer                           NOT NULL,
                                     CONSTRAINT "UQ_cb6b62e21b8f8312506131cf32f" UNIQUE ("identifier")
                                 )`, undefined);

        // Add old data if needed.
        if (wormholeModelData.length) {
            const wormholeValues = wormholeModelData.map((data) => `(${data.identifier})`);
            await queryRunner.query(`INSERT INTO "wormhole_model" (identifier) VALUES ${wormholeValues.join(',')}`);
        }
    }

    private static async migrateChannelModel(queryRunner: QueryRunner) {

        // Get old data if needed
        let channelModelData: IChannelModelData[] = [];
        const channelModelExists = await queryRunner.query(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='channel_model';
        `);
        if (channelModelExists.length) {
            channelModelData = await queryRunner.query(`SELECT * FROM "channel_model"`);
        }

        // Drop old table
        await queryRunner.query(`DROP TABLE IF EXISTS "channel_model"`);

        // Create table
        await queryRunner.query(`CREATE TABLE "channel_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" varchar                           NOT NULL,
                                     CONSTRAINT "UQ_4e45869c257952fd01bf1ad8776" UNIQUE ("identifier")
                                 )`, undefined);

        // Add old data if needed.
        if (channelModelData.length) {
            const channelValues = channelModelData.map((data) => `(${data.identifier})`);
            await queryRunner.query(`INSERT INTO "channel_model" (identifier) VALUES ${channelValues.join(',')}`);
        }
    }

    private static async migrateUserChannelModel(queryRunner: QueryRunner) {

        // Get old data if needed
        let userChannelModelData: IChannelModelData[] = [];
        const userChannelModelExists = await queryRunner.query(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='user_channel_model';
        `);
        if (userChannelModelExists.length) {
            userChannelModelData = await queryRunner.query(`SELECT * FROM "user_channel_model"`);
        }

        // Drop old table
        await queryRunner.query(`DROP TABLE IF EXISTS "user_channel_model"`);

        // Create table
        await queryRunner.query(`CREATE TABLE "user_channel_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" varchar                           NOT NULL,
                                     CONSTRAINT "UQ_72596116abbb2625f74b727d01c" UNIQUE ("identifier")
                                 )`, undefined);

        // Add old data if needed.
        if (userChannelModelData.length) {
            const userChannelValues = userChannelModelData.map((data) => `(${data.identifier})`);
            await queryRunner.query(`INSERT INTO "user_channel_model" (identifier) VALUES ${userChannelValues.join(',')}`);
        }
    }

    public async up(queryRunner: QueryRunner): Promise<any> {
        await Initial1571080868409.migrateWormholeModel(queryRunner);
        await Initial1571080868409.migrateChannelModel(queryRunner);
        await Initial1571080868409.migrateUserChannelModel(queryRunner);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "wormhole_model"`, undefined);
        await queryRunner.query(`DROP TABLE "user_channel_model"`, undefined);
        await queryRunner.query(`DROP TABLE "channel_model"`, undefined);
    }

}
