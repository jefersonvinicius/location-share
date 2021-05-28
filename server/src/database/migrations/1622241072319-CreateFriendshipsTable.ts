import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFriendshipsTable1622241072319 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        return queryRunner.createTable(
            new Table({
                name: 'friendships',
                columns: [
                    { name: 'id', type: 'integer', isPrimary: true, generationStrategy: 'increment' },
                    {
                        name: 'user_id',
                        type: 'integer',
                    },
                    {
                        name: 'friend_id',
                        type: 'integer',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}
}
