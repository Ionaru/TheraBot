import { createConnection } from 'typeorm';

import { debug } from '../main';

export class DatabaseController {

    private debug = debug.extend('database');

    public async connect() {

        this.debug('Creating database connection');

        return createConnection();
    }
}
