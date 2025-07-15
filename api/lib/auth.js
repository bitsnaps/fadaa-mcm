const crypto = require('crypto');

// Password hashing function
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

// Password verification function
const verifyPassword = (password, storedHash) => {
    if (!storedHash) {
        return false;
    }
    const [salt, hash] = storedHash.split(':');
    const hashToVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === hashToVerify;
};

module.exports = {
    hashPassword,
    verifyPassword
};