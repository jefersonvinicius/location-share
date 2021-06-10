import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
