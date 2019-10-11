import { BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseModel extends BaseEntity {

    @PrimaryGeneratedColumn()
    public id!: number;

    @CreateDateColumn({
        select: false,
    })
    public createdOn!: Date;

    @UpdateDateColumn({
        select: false,
    })
    public updatedOn!: Date;
}
