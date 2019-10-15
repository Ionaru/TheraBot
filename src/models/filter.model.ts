import { Entity } from 'typeorm';

import { BaseModel } from './base.model';
// import { ChannelModel } from './channel.model';

enum FilterType {
    SecurityStatus,
    System,
    Constellation,
    Region,
}

@Entity()
export class FilterModel extends BaseModel {

    public type: FilterType;

    public filter: string;

    // @OneToMany(() => ChannelModel, (channel: ChannelModel) => )
    // public channel: ChannelModel;

    constructor(type: FilterType, filter: string) {
        super();
        this.type = type;
        this.filter = filter;
    }
}
