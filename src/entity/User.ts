import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm";

@Entity()
@Unique(["chatId"])
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    chatId!: string;

    @Column({ nullable: true })
    username!: string;
}
