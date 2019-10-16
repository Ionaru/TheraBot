import { MigrationInterface, QueryRunner } from 'typeorm';

// noinspection JSUnusedGlobalSymbols
export class Filters1571236401294 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "filter_model"
                                 (
                                     "id"        integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                                     "createdOn" datetime NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn" datetime NOT NULL DEFAULT (datetime('now')),
                                     "type"      integer  NOT NULL,
                                     "filter"    varchar  NOT NULL,
                                     "channelId" integer,
                                     CONSTRAINT "UQ_85df55df999f201ca5b0eadd17d" UNIQUE ("filter", "channelId"),
                                     CONSTRAINT "FK_2747f6b33e3d006918d09ba8781" FOREIGN KEY ("channelId") REFERENCES "channel_model" ("id") ON DELETE CASCADE ON UPDATE RESTRICT
                                 )`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "filter_model"`, undefined);
    }

}
