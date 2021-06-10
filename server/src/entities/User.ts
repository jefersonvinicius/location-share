import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({ type: 'text', nullable: true })
    photo: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToMany(() => User)
    @JoinTable({ name: 'friendships', joinColumn: { name: 'user_id' }, inverseJoinColumn: { name: 'friend_id' } })
    friends: User[];

    // @ManyToMany(() => User)
    // @JoinTable({ name: 'friendships_requests' })
    // friendshipsRequests: User[];
}

export default User;
