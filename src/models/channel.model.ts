import { Column, Entity, OneToMany } from 'typeorm';

import { BaseModel } from './base.model';
import { FilterModel } from './filter.model';

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

    @OneToMany(() => FilterModel, (filter) => filter.channel, {
        eager: true,
    })
    public filters!: FilterModel[];

    constructor(type: ChannelType, identifier: string) {
        super();
        this.type = type;
        this.identifier = identifier;
    }
}
