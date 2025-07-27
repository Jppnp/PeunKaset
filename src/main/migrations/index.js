import semver from 'semver';
import migration001 from './001_add_remark_column.js';
import migration002 from './002_add_cost_price_column.js';

export const migrations = [
  migration001,
  migration002
];

/**
 * Get migrations for version range
 * @param {string} fromVersion - Starting version
 * @param {string} toVersion - Target version
 * @returns {Array} Applicable migrations
 */
export function getMigrationsForVersion(fromVersion, toVersion) {
  return migrations.filter(migration => {
    return semver.gt(migration.version, fromVersion) &&
           semver.lte(migration.version, toVersion);
  });
}

/**
 * Validate all migrations
 * @returns {boolean} True if all migrations are valid
 */
export function validateMigrations() {
  return migrations.every(migration => {
    return migration.version &&
           migration.description &&
           typeof migration.up === 'function';
  });
}