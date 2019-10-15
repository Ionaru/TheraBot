/**
 * @file Manages the configuration settings for the TypeORM.
 */

const runningMigration = process.argv.length >= 3 && process.argv[2].includes('migration');
const runningTSMain = process.argv[1].includes('main.ts');

const models = [
    'channel.model',
    'user-channel.model',
    'wormhole.model',
];

const connectionOptions = {
    database: 'data/therabot.db',
    type: 'sqlite',
};

if (runningMigration || runningTSMain) {
    connectionOptions.entities = models.map((model) => `src/models/${model}.ts`);
} else {
    connectionOptions.entities = models.map((model) => `dist/models/${model}.js`);
}

if (runningMigration) {
    connectionOptions.cli = {
        migrationsDir: 'src/migrations',
    };
    connectionOptions.migrations = ['src/migrations/*.ts'];
    connectionOptions.migrationsTableName = 'migrations';
}

module.exports = connectionOptions;
