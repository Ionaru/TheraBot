import { Column, Entity, OneToMany } from 'typeorm';

import { BaseModel } from './base.model';
import { FilterModel } from './filter.model';

export enum ChannelType {
    TEXT_CHANNEL,
    DM_CHANNEL,
}

@Entity()
export class ChannelModel extends BaseModel {

    @Column({
        unique: true,
    })
    public identifier: string;

    @Column()
    public active: boolean;

    @Column()
    public type: ChannelType;

    @OneToMany('FilterModel', 'channel', {
        eager: true,
    })
    public filters!: FilterModel[];

    public constructor(type: ChannelType, identifier: string) {
        super();
        this.type = type;
        this.identifier = identifier;
        this.active = true;
    }
}
