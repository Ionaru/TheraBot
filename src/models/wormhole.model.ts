import { Entity } from 'typeorm';

import { BaseModel } from './base.model';

@Entity()
export class WormholeModel extends BaseModel {

    public constructor(identifier: number) {
        super();
        this.id = identifier;
    }
}
