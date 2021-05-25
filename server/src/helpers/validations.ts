import { StrUtils } from './strings';

export function isValidPassword(password: string) {
    const requirementsStats = Array<boolean>(3).fill(false);

    for (let i = 0; i < password.length; i++) {
        if (StrUtils.isLetter(password[i]) && password[i] === password[i].toLowerCase()) requirementsStats[0] = true;
        if (StrUtils.isLetter(password[i]) && password[i] === password[i].toUpperCase()) requirementsStats[1] = true;
        if (!isNaN(parseInt(password[i]))) requirementsStats[2] = true;
    }

    return requirementsStats.every((requirement) => requirement);
}
