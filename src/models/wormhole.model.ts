import { Column, Entity } from 'typeorm';

import { BaseModel } from './base.model';

@Entity()
export class WormholeModel extends BaseModel {

    @Column({
        unique: true,
    })
    public identifier: number;

    constructor(identifier: number) {
        super();
        this.identifier = identifier;
    }
}
