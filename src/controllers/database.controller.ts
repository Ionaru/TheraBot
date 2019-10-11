import { createConnection } from 'typeorm';

import { debug } from '../main';
import { ChannelModel } from '../models/channel.model';
import { UserChannelModel } from '../models/user-channel.model';
import { WormholeModel } from '../models/wormhole.model';

export class DatabaseController {

    private debug = debug.extend('database');

    public async connect() {

        this.debug('Creating database connection');

        return createConnection({
            database: 'therabot.db',
            entities: [
                ChannelModel,
                UserChannelModel,
                WormholeModel,
            ],
            synchronize: true,
            type: 'sqlite',
        });
    }
}
