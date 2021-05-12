export function isValidPassword(password: string) {
    const requirementsStats = Array(3).fill(false);

    for (let i = 0; i < password.length; i++) {
        if (password[i] === password[i].toLowerCase()) requirementsStats[0] = true;
        if (password[i] === password[i].toUpperCase()) requirementsStats[1] = true;
        if (!isNaN(parseInt(password[i]))) requirementsStats[2] = true;
    }

    return requirementsStats.every((requirement) => requirement);
}
