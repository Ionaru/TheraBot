import { Column, Entity, ManyToOne, Unique } from 'typeorm';

import { BaseModel } from './base.model';
import { ChannelModel } from './channel.model';

export enum FilterType {
    SecurityStatus,
    SecurityClass,
    System,
    Constellation,
    Region,
}

@Entity()
@Unique(['filter', 'channel'])
export class FilterModel extends BaseModel {

    @Column()
    public type: FilterType;

    @Column()
    public filter: string;

    @ManyToOne(() => ChannelModel, (channel) => channel.filters, {
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT',
    })
    public channel: ChannelModel;

    public constructor(channel: ChannelModel, type: FilterType, filter: string) {
        super();
        this.channel = channel;
        this.type = type;
        this.filter = filter;
    }
}
