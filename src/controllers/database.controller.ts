import { DataSource } from 'typeorm';

import { debug } from '../debug';
import { ChannelModel } from '../models/channel.model';
import { FilterModel } from '../models/filter.model';
import { WormholeModel } from '../models/wormhole.model';

export class DatabaseController {

    private debug = debug.extend('database');

    public async connect() {

        this.debug('Creating database connection');

        const dataSource = new DataSource({
            database: 'data/therabot.db',
            entities: [ChannelModel, FilterModel, WormholeModel],
            type: 'better-sqlite3',
        });
        const connection = await dataSource.initialize();

        this.debug(`Database: ${connection.driver.database}`);
        this.debug(`Entities: ${connection.entityMetadatas.map((entity) => entity.targetName).join(', ')}`);
    }
}
