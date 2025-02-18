import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { User } from "./User";

@Entity()
@Index(["user", "date"], { unique: true })
export class Entry {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "date", default: () => "CURRENT_DATE" })
    date!: string;

    @Column({ type: 'boolean', nullable: true })
    truth1!: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    truth2!: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    truth3!: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    truth4!: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    truth5!: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    truth6!: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    truth7!: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    truth8!: boolean | null;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @ManyToOne(() => User)
    @JoinColumn()
    user!: User;
}
