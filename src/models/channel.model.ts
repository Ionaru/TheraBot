import { Column, Entity } from 'typeorm';

import { BaseModel } from './base.model';

export enum ChannelType {
    TextChannel,
    DMChannel,
}

@Entity()
export class ChannelModel extends BaseModel {

    @Column({
        unique: true,
    })
    public identifier: string;

    @Column()
    public active: boolean = true;

    @Column()
    public type: ChannelType;

    constructor(type: ChannelType, identifier: string) {
        super();
        this.type = type;
        this.identifier = identifier;
    }
}
