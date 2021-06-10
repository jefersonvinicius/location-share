import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'friendships' })
export default class Friendship extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ name: 'friend_id' })
    friendId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
