import sqlite3 from 'sqlite3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseMigrator {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.backupPath = null;
    this.migrations = [];
    this.migrationsPath = path.join(__dirname, '../migrations');
  }

  /**
   * Initialize the migrator and load migrations
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this._ensureSchemaVersionTable();
      await this._loadMigrations();
    } catch (error) {
      throw new Error(`Failed to initialize DatabaseMigrator: ${error.message}`);
    }
  }

  /**
   * Get current database schema version
   * @returns {Promise<string>} Current schema version
   */
  async getCurrentSchemaVersion() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.get(
        "SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1",
        (err, row) => {
          db.close();
          if (err) {
            reject(new Error(`Failed to get schema version: ${err.message}`));
          } else {
            resolve(row ? row.version : '0.0.0');
          }
        }
      );
    });
  }

  /**
   * Get target schema version for app version
   * @param {string} appVersion - Application version
   * @returns {string} Target schema version
   */
  getTargetSchemaVersion(appVersion) {
    // Find the highest migration version that is <= app version
    const applicableMigrations = this.migrations.filter(migration => 
      semver.lte(migration.version, appVersion)
    );
    
    if (applicableMigrations.length === 0) {
      return '0.0.0';
    }
    
    return applicableMigrations
      .sort((a, b) => semver.compare(b.version, a.version))[0].version;
  }

  /**
   * Get migrations to apply between versions
   * @param {string} fromVersion - Current version
   * @param {string} toVersion - Target version
   * @returns {Array} Array of migrations to apply
   */
  getMigrationsToApply(fromVersion, toVersion) {
    return this.migrations
      .filter(migration => 
        semver.gt(migration.version, fromVersion) && 
        semver.lte(migration.version, toVersion)
      )
      .sort((a, b) => semver.compare(a.version, b.version));
  }

  /**
   * Apply migrations to database
   * @param {Array} migrations - Migrations to apply
   * @returns {Promise<void>}
   */
  async applyMigrations(migrations) {
    if (migrations.length === 0) {
      console.log('No migrations to apply');
      return;
    }

    console.log(`Applying ${migrations.length} migrations...`);

    for (const migration of migrations) {
      try {
        console.log(`Applying migration: ${migration.version} - ${migration.description}`);
        
        // Validate migration before applying
        await this._validateMigration(migration);
        
        // Apply migration
        await this._applyMigration(migration);
        
        // Record migration in schema_version table
        await this._recordMigration(migration);
        
        console.log(`Migration ${migration.version} applied successfully`);
      } catch (error) {
        throw new Error(`Migration ${migration.version} failed: ${error.message}`);
      }
    }
  }

  /**
   * Rollback migrations
   * @param {Array} migrations - Migrations to rollback
   * @returns {Promise<void>}
   */
  async rollbackMigrations(migrations) {
    if (migrations.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    console.log(`Rolling back ${migrations.length} migrations...`);

    // Rollback in reverse order
    const reversedMigrations = [...migrations].reverse();

    for (const migration of reversedMigrations) {
      try {
        console.log(`Rolling back migration: ${migration.version}`);
        
        if (migration.down) {
          await this._rollbackMigration(migration);
        } else {
          console.warn(`Migration ${migration.version} has no rollback method`);
        }
        
        // Remove migration record
        await this._removeMigrationRecord(migration);
        
        console.log(`Migration ${migration.version} rolled back successfully`);
      } catch (error) {
        console.error(`Rollback of migration ${migration.version} failed: ${error.message}`);
        // Continue with other rollbacks
      }
    }
  }

  /**
   * Create database backup
   * @returns {Promise<string>} Backup file path
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupPath = `${this.dbPath}.backup.${timestamp}`;
    
    try {
      await fs.copyFile(this.dbPath, this.backupPath);
      console.log(`Database backup created: ${this.backupPath}`);
      return this.backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }

  /**
   * Restore database from backup
   * @param {string} backupPath - Backup file path (optional)
   * @returns {Promise<void>}
   */
  async restoreFromBackup(backupPath = null) {
    const restorePath = backupPath || this.backupPath;
    
    if (!restorePath) {
      throw new Error('No backup path specified');
    }

    try {
      // Verify backup file exists
      await fs.access(restorePath);
      
      // Restore database
      await fs.copyFile(restorePath, this.dbPath);
      console.log(`Database restored from backup: ${restorePath}`);
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }

  /**
   * Verify backup integrity
   * @param {string} backupPath - Backup file path
   * @returns {Promise<boolean>} True if backup is valid
   */
  async verifyBackup(backupPath = null) {
    const verifyPath = backupPath || this.backupPath;
    
    if (!verifyPath) {
      return false;
    }

    try {
      // Try to open backup database
      return new Promise((resolve) => {
        const testDb = new sqlite3.Database(verifyPath, sqlite3.OPEN_READONLY, (err) => {
          if (err) {
            resolve(false);
          } else {
            testDb.get("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1", (err, row) => {
              testDb.close();
              resolve(!err && row);
            });
          }
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * Clean up old backups
   * @param {number} maxBackups - Maximum number of backups to keep
   * @returns {Promise<void>}
   */
  async cleanupOldBackups(maxBackups = 5) {
    try {
      const dbDir = path.dirname(this.dbPath);
      const dbName = path.basename(this.dbPath);
      const files = await fs.readdir(dbDir);
      
      // Find backup files
      const backupFiles = files
        .filter(file => file.startsWith(`${dbName}.backup.`))
        .map(file => ({
          name: file,
          path: path.join(dbDir, file),
          time: file.split('.backup.')[1]
        }))
        .sort((a, b) => b.time.localeCompare(a.time));

      // Remove old backups
      if (backupFiles.length > maxBackups) {
        const filesToRemove = backupFiles.slice(maxBackups);
        
        for (const file of filesToRemove) {
          await fs.unlink(file.path);
          console.log(`Removed old backup: ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Validate database integrity
   * @returns {Promise<boolean>} True if database is valid
   */
  async validateDatabaseIntegrity() {
    return new Promise((resolve) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.get("PRAGMA integrity_check", (err, row) => {
        db.close();
        if (err) {
          resolve(false);
        } else {
          resolve(row && row.integrity_check === 'ok');
        }
      });
    });
  }

  /**
   * Validate migration scripts
   * @returns {Promise<boolean>} True if all migrations are valid
   */
  async validateMigrationScripts() {
    try {
      for (const migration of this.migrations) {
        if (!migration.version || !migration.up || typeof migration.up !== 'function') {
          console.error(`Invalid migration: ${migration.version || 'unknown'}`);
          return false;
        }
        
        if (!semver.valid(migration.version)) {
          console.error(`Invalid version format: ${migration.version}`);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Migration validation failed:', error);
      return false;
    }
  }

  /**
   * Ensure schema_version table exists
   * @returns {Promise<void>}
   * @private
   */
  async _ensureSchemaVersionTable() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version TEXT PRIMARY KEY,
          description TEXT,
          applied_at TEXT NOT NULL
        )
      `, (err) => {
        db.close();
        if (err) {
          reject(new Error(`Failed to create schema_version table: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load migration files
   * @returns {Promise<void>}
   * @private
   */
  async _loadMigrations() {
    try {
      // Import migrations index
      const migrationsModule = await import('../migrations/index.js');
      this.migrations = migrationsModule.migrations || [];
      
      console.log(`Loaded ${this.migrations.length} migrations`);
    } catch (error) {
      console.warn('No migrations found or failed to load migrations:', error.message);
      this.migrations = [];
    }
  }

  /**
   * Validate migration before applying
   * @param {Object} migration - Migration to validate
   * @returns {Promise<void>}
   * @private
   */
  async _validateMigration(migration) {
    if (!migration.version || !migration.up) {
      throw new Error('Invalid migration: missing version or up method');
    }

    if (!semver.valid(migration.version)) {
      throw new Error(`Invalid version format: ${migration.version}`);
    }

    // Check if migration was already applied
    const currentVersion = await this.getCurrentSchemaVersion();
    if (semver.lte(migration.version, currentVersion)) {
      throw new Error(`Migration ${migration.version} already applied`);
    }
  }

  /**
   * Apply a single migration
   * @param {Object} migration - Migration to apply
   * @returns {Promise<void>}
   * @private
   */
  async _applyMigration(migration) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      migration.up(db)
        .then(() => {
          db.close();
          resolve();
        })
        .catch((error) => {
          db.close();
          reject(error);
        });
    });
  }

  /**
   * Rollback a single migration
   * @param {Object} migration - Migration to rollback
   * @returns {Promise<void>}
   * @private
   */
  async _rollbackMigration(migration) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      migration.down(db)
        .then(() => {
          db.close();
          resolve();
        })
        .catch((error) => {
          db.close();
          reject(error);
        });
    });
  }

  /**
   * Record migration in schema_version table
   * @param {Object} migration - Applied migration
   * @returns {Promise<void>}
   * @private
   */
  async _recordMigration(migration) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(
        "INSERT INTO schema_version (version, description, applied_at) VALUES (?, ?, ?)",
        [migration.version, migration.description || '', new Date().toISOString()],
        (err) => {
          db.close();
          if (err) {
            reject(new Error(`Failed to record migration: ${err.message}`));
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Remove migration record from schema_version table
   * @param {Object} migration - Migration to remove
   * @returns {Promise<void>}
   * @private
   */
  async _removeMigrationRecord(migration) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath);
      
      db.run(
        "DELETE FROM schema_version WHERE version = ?",
        [migration.version],
        (err) => {
          db.close();
          if (err) {
            reject(new Error(`Failed to remove migration record: ${err.message}`));
          } else {
            resolve();
          }
        }
      );
    });
  }
}