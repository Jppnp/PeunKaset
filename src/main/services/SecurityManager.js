import crypto from 'crypto';
import pkg from 'electron';
const { app, safeStorage } = pkg;
import fs from 'fs/promises';
import path from 'path';
import { Buffer } from 'buffer';

export class SecurityManager {
  constructor() {
    this.tokenStorePath = path.join(app.getPath('userData'), 'secure-tokens.dat');
    this.encryptionKey = null;
  }

  /**
   * Initialize security manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Generate or load encryption key
      await this._initializeEncryptionKey();
    } catch (error) {
      console.error('Failed to initialize SecurityManager:', error);
      throw error;
    }
  }

  /**
   * Store GitHub token securely
   * @param {string} token - GitHub Personal Access Token
   * @returns {Promise<void>}
   */
  async storeGitHubToken(token) {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token provided');
      }

      let encryptedToken;
      
      if (safeStorage.isEncryptionAvailable()) {
        // Use Electron's safeStorage if available
        encryptedToken = safeStorage.encryptString(token);
      } else {
        // Fallback to custom encryption
        encryptedToken = this._encrypt(token);
      }

      const tokenData = {
        token: encryptedToken.toString('base64'),
        timestamp: Date.now(),
        method: safeStorage.isEncryptionAvailable() ? 'safeStorage' : 'custom'
      };

      await fs.writeFile(this.tokenStorePath, JSON.stringify(tokenData), 'utf8');
    } catch (error) {
      throw new Error(`Failed to store GitHub token: ${error.message}`);
    }
  }

  /**
   * Retrieve GitHub token securely
   * @returns {Promise<string|null>} Decrypted token or null if not found
   */
  async getGitHubToken() {
    try {
      const data = await fs.readFile(this.tokenStorePath, 'utf8');
      const tokenData = JSON.parse(data);

      if (!tokenData.token) {
        return null;
      }

      const encryptedBuffer = Buffer.from(tokenData.token, 'base64');

      if (tokenData.method === 'safeStorage' && safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(encryptedBuffer);
      } else {
        return this._decrypt(encryptedBuffer);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw new Error(`Failed to retrieve GitHub token: ${error.message}`);
    }
  }

  /**
   * Remove stored GitHub token
   * @returns {Promise<void>}
   */
  async removeGitHubToken() {
    try {
      await fs.unlink(this.tokenStorePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to remove GitHub token: ${error.message}`);
      }
    }
  }

  /**
   * Validate GitHub token format
   * @param {string} token - Token to validate
   * @returns {boolean} True if token format is valid
   */
  validateGitHubTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // GitHub Personal Access Token patterns
    const patterns = [
      /^ghp_[a-zA-Z0-9]{36}$/, // Classic PAT
      /^github_pat_[a-zA-Z0-9_]{82}$/, // Fine-grained PAT
      /^gho_[a-zA-Z0-9]{36}$/, // OAuth token
      /^ghu_[a-zA-Z0-9]{36}$/, // User-to-server token
      /^ghs_[a-zA-Z0-9]{36}$/, // Server-to-server token
      /^ghr_[a-zA-Z0-9]{76}$/ // Refresh token
    ];

    return patterns.some(pattern => pattern.test(token));
  }

  /**
   * Calculate file hash for integrity verification
   * @param {string} filePath - Path to file
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {Promise<string>} File hash
   */
  async calculateFileHash(filePath, algorithm = 'sha256') {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash(algorithm);
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Failed to calculate file hash: ${error.message}`);
    }
  }

  /**
   * Verify file integrity using hash
   * @param {string} filePath - Path to file
   * @param {string} expectedHash - Expected hash value
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {Promise<boolean>} True if file is valid
   */
  async verifyFileIntegrity(filePath, expectedHash, algorithm = 'sha256') {
    try {
      const actualHash = await this.calculateFileHash(filePath, algorithm);
      return actualHash.toLowerCase() === expectedHash.toLowerCase();
    } catch (error) {
      console.error('File integrity verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random string
   * @param {number} length - Length of random string
   * @returns {string} Random string
   */
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate file path to prevent directory traversal
   * @param {string} filePath - File path to validate
   * @param {string} allowedDirectory - Allowed base directory
   * @returns {boolean} True if path is safe
   */
  validateFilePath(filePath, allowedDirectory) {
    try {
      const resolvedPath = path.resolve(filePath);
      const resolvedAllowed = path.resolve(allowedDirectory);
      return resolvedPath.startsWith(resolvedAllowed);
    } catch {
      return false;
    }
  }

  /**
   * Initialize encryption key
   * @returns {Promise<void>}
   * @private
   */
  async _initializeEncryptionKey() {
    const keyPath = path.join(app.getPath('userData'), 'encryption.key');
    
    try {
      // Try to load existing key
      const keyData = await fs.readFile(keyPath);
      this.encryptionKey = keyData;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Generate new key
        this.encryptionKey = crypto.randomBytes(32);
        await fs.writeFile(keyPath, this.encryptionKey);
      } else {
        throw error;
      }
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @returns {Buffer} Encrypted data
   * @private
   */
  _encrypt(text) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from('puenkaset-updater', 'utf8'));

    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {Buffer} encryptedData - Encrypted data
   * @returns {string} Decrypted text
   * @private
   */
  _decrypt(encryptedData) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const IV = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const encrypted = encryptedData.slice(32);

    const decipher = crypto.createDecipher('aes-256-gcm', this.encryptionKey);
    decipher.setAAD(Buffer.from('puenkaset-updater', 'utf8'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}