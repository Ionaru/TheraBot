import { initDatabase } from '../database/connection';
import { debug } from '../debug';

export class DatabaseController {

    private debug = debug.extend('database');

    public connect(): Promise<void> {

        this.debug('Creating database connection');

        initDatabase();

        this.debug('Database connection established');

        return Promise.resolve();
    }
}
