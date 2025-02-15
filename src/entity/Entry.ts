import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Entry {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "date", default: () => "CURRENT_DATE" })
    date!: string;

    @Column({ default: true })
    truth1!: boolean;

    @Column({ default: true })
    truth2!: boolean;

    @Column({ default: true })
    truth3!: boolean;

    @Column({ default: true })
    truth4!: boolean;

    @Column({ default: true })
    truth5!: boolean;

    @Column({ default: true })
    truth6!: boolean;

    @Column({ default: true })
    truth7!: boolean;

    @Column({ default: true })
    truth8!: boolean;

    @ManyToOne(() => User)
    @JoinColumn()
    user!: User;
}
