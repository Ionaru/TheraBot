import { Entity } from 'typeorm';

import { ChannelModel } from './channel.model';

@Entity()
export class UserChannelModel extends ChannelModel {

    constructor(identifier: string) {
        super(identifier);
    }
}
