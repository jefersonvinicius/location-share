import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import User from './User';

@Entity({ name: 'friendships_requests' })
export class FriendshipRequest extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'friend_id' })
    friendId: string;
    
    @Column()
    status: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user)
    @JoinColumn({name: 'friend_id'})
    friend: User;

    @ManyToOne(() => User, (user) => user)
    @JoinColumn({name: 'user_id'})
    user: User;
}
