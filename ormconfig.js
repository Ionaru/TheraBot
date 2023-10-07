/**
 * @file Manages the configuration settings for the TypeORM.
 */
const { DataSource } = require("typeorm");

const runningMigration = process.argv.length >= 3 && process.argv[2].includes('migration');
const runningTSMain = process.argv[1].includes('main.ts');

const models = [
    'channel.model',
    'filter.model',
    'wormhole.model',
];

const connectionOptions = {
    database: 'data/therabot.db',
    type: 'better-sqlite3',
};

connectionOptions.entities = models.map((model) =>
    runningMigration || runningTSMain ? `src/models/${model}.ts` : `dist/models/${model}.js`
);

if (runningMigration) {
    connectionOptions.cli = {
        migrationsDir: 'migrations',
    };
    connectionOptions.migrations = ['migrations/*.ts'];
    connectionOptions.migrationsTableName = 'migrations';
}

const dataSource = new DataSource(connectionOptions);
module.exports = { dataSource };
