import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class WormholeId1571692529004 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "temporary_wormhole_model"
                                 (
                                     "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn" datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn" datetime                          NOT NULL DEFAULT (datetime('now'))
                                 )`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_wormhole_model"("id", "createdOn", "updatedOn")
                                 SELECT "identifier", "createdOn", "updatedOn"
                                 FROM "wormhole_model"`, undefined);
        await queryRunner.query(`DROP TABLE "wormhole_model"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_wormhole_model"
            RENAME TO "wormhole_model"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "wormhole_model"
            RENAME TO "temporary_wormhole_model"`, undefined);
        await queryRunner.query(`CREATE TABLE "wormhole_model"
                                 (
                                     "id"         integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn"  datetime                          NOT NULL DEFAULT (datetime('now')),
                                     "identifier" integer                           NOT NULL,
                                     CONSTRAINT "UQ_cb6b62e21b8f8312506131cf32f" UNIQUE ("identifier")
                                 )`, undefined);
        await queryRunner.query(`INSERT INTO "wormhole_model"("id", "createdOn", "updatedOn", "identifier")
                                 SELECT "id", "createdOn", "updatedOn", "id"
                                 FROM "temporary_wormhole_model"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_wormhole_model"`, undefined);
    }

}
