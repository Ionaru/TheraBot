import { createConnection } from 'typeorm';

import { debug } from '../main';

export class DatabaseController {

    private debug = debug.extend('database');

    public async connect() {

        this.debug('Creating database connection');

        const connection = await createConnection();

        this.debug(`Database: ${connection.driver.database}`);
        this.debug(`Entities: ${connection.entityMetadatas.map((entity) => entity.targetName).join(', ')}`);
    }
}
