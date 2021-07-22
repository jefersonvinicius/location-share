import { Exclude } from 'class-transformer';
import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { FriendshipRequest } from './FriendshipRequest';

@Entity({ name: 'users' })
class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Exclude()
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

    @OneToMany(() => FriendshipRequest, (request) => request.user)
    friendshipRequests: FriendshipRequest[];
}

export default User;
