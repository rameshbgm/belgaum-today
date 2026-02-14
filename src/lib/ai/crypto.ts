/**
 * AES-256-GCM encryption/decryption for API keys stored in the database.
 * Uses JWT_SECRET as the encryption passphrase.
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
    const secret = process.env.JWT_SECRET || 'default-secret-change-me';
    return crypto.scryptSync(secret, 'belgaum-today-salt', 32);
}

/**
 * Encrypt a plaintext API key for storage in the database.
 * Returns a base64 string containing: iv + authTag + ciphertext.
 */
export function encryptApiKey(plaintext: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Pack: iv (12) + authTag (16) + ciphertext
    const packed = Buffer.concat([iv, authTag, encrypted]);
    return packed.toString('base64');
}

/**
 * Decrypt a base64-encoded encrypted API key from the database.
 */
export function decryptApiKey(encrypted: string): string {
    const key = getKey();
    const packed = Buffer.from(encrypted, 'base64');

    const iv = packed.subarray(0, IV_LENGTH);
    const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = packed.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}

/**
 * Mask an API key for display (show first 4 and last 4 characters).
 */
export function maskApiKey(key: string): string {
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}${'*'.repeat(Math.min(key.length - 8, 20))}${key.substring(key.length - 4)}`;
}
