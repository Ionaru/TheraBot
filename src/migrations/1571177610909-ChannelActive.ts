import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class ChannelActive1571177610909 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "temporary_channel_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" varchar                           NOT NULL,
                                     "type"       integer                           NOT NULL,
                                     "active"     boolean                           NOT NULL,
                                     CONSTRAINT "UQ_4e45869c257952fd01bf1ad8776" UNIQUE ("identifier")
                                 )`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_channel_model"("id", "createdOn", "updatedOn", "identifier", "type", "active")
                                 SELECT "id", "createdOn", "updatedOn", "identifier", "type", TRUE
                                 FROM "channel_model"`, undefined);
        await queryRunner.query(`DROP TABLE "channel_model"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_channel_model"
            RENAME TO "channel_model"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "channel_model"
            RENAME TO "temporary_channel_model"`, undefined);
        await queryRunner.query(`CREATE TABLE "channel_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" varchar                           NOT NULL,
                                     "type"       integer                           NOT NULL,
                                     CONSTRAINT "UQ_4e45869c257952fd01bf1ad8776" UNIQUE ("identifier")
                                 )`, undefined);
        await queryRunner.query(`INSERT INTO "channel_model"("id", "createdOn", "updatedOn", "identifier", "type")
                                 SELECT "id", "createdOn", "updatedOn", "identifier", "type"
                                 FROM "temporary_channel_model"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_channel_model"`, undefined);
    }

}
