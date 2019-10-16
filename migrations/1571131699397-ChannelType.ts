import { MigrationInterface, QueryRunner } from 'typeorm';

interface IBaseModelData {
    id: number;
    createdOn: string;
    updatedOn: string;
}

interface IChannelModelData extends IBaseModelData {
    identifier: string;
    type: 0 | 1;
}

// noinspection JSUnusedGlobalSymbols
export class ChannelType1571131699397 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {

        await queryRunner.query(`CREATE TABLE "temporary_channel_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" varchar                           NOT NULL,
                                     "type"       integer                           NOT NULL,
                                     CONSTRAINT "UQ_4e45869c257952fd01bf1ad8776" UNIQUE ("identifier")
                                 )`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_channel_model"("id", "createdOn", "updatedOn", "identifier", "type")
                                 SELECT "id", "createdOn", "updatedOn", "identifier", 0
                                 FROM "channel_model"`, undefined);

        await queryRunner.query(`DROP TABLE "channel_model"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_channel_model"
            RENAME TO "channel_model"`, undefined);

        await queryRunner.query(`INSERT INTO "channel_model"("createdOn", "updatedOn", "identifier", "type")
                                 SELECT "createdOn", "updatedOn", "identifier", 1
                                 FROM "user_channel_model"`, undefined);

        await queryRunner.query(`DROP TABLE "user_channel_model"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {

        const data: IChannelModelData[] = await queryRunner.query(`SELECT * FROM "channel_model"`);
        const userChannelModelData = data.filter((channel) => channel.type === 1);
        const userChannelModelValues = userChannelModelData.map((channel) => `(${channel.identifier})`);

        await queryRunner.query(`CREATE TABLE "user_channel_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" varchar                           NOT NULL,
                                     CONSTRAINT "UQ_72596116abbb2625f74b727d01c" UNIQUE ("identifier")
                                 )`, undefined);

        await queryRunner.query(`INSERT INTO "user_channel_model" ("identifier") VALUES ${userChannelModelValues.join(',')}`);

        await queryRunner.query(`DELETE FROM "channel_model" WHERE "type" = 1`);

        await queryRunner.query(`CREATE TABLE "temporary_channel_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" varchar                           NOT NULL,
                                     CONSTRAINT "UQ_4e45869c257952fd01bf1ad8776" UNIQUE ("identifier")
                                 )`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_channel_model"("id", "createdOn", "updatedOn", "identifier")
                                 SELECT "id", "createdOn", "updatedOn", "identifier"
                                 FROM "channel_model"`, undefined);

        await queryRunner.query(`DROP TABLE "channel_model"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_channel_model"
            RENAME TO "channel_model"`, undefined);
    }

}
