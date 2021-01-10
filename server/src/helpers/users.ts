import User from '@app/entities/User';

type UserAlreadyExistsOptions = {
    id?: number;
    username?: string;
};

export async function userAlreadyExists(options: UserAlreadyExistsOptions) {
    if (options.id) {
        return !!(await User.findOne(options.id));
    } else {
        return !!(await User.findOne({ where: { username: options.username } }));
    }
}
