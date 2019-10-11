import { Column, Entity } from 'typeorm';

import { BaseModel } from './base.model';

@Entity()
export class ChannelModel extends BaseModel {

    @Column({
        unique: true,
    })
    public identifier: string;

    constructor(identifier: string) {
        super();
        this.identifier = identifier;
    }
}
