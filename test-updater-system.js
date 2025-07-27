/**
 * Comprehensive Test Script for Puenkaset Updater System
 * This script tests all major components and identifies potential issues
 */

import { UpdateManager } from './src/main/services/UpdateManager.js';
import { GitHubService } from './src/main/services/GitHubService.js';
import { SecurityManager } from './src/main/services/SecurityManager.js';
import { DownloadManager } from './src/main/services/DownloadManager.js';
import { DatabaseMigrator } from './src/main/services/DatabaseMigrator.js';
import { migrations } from './src/main/migrations/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UpdaterSystemTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      issues: [],
      recommendations: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  addIssue(severity, component, description, recommendation = null) {
    this.testResults.issues.push({
      severity,
      component,
      description,
      recommendation
    });
    
    if (recommendation) {
      this.testResults.recommendations.push(recommendation);
    }
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Testing: ${testName}`, 'info');
      await testFunction();
      this.testResults.passed++;
      this.log(`✅ ${testName} - PASSED`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.log(`❌ ${testName} - FAILED: ${error.message}`, 'error');
      this.addIssue('high', testName, error.message);
    }
  }

  // Test 1: Configuration Validation
  async testConfiguration() {
    await this.runTest('Configuration Validation', async () => {
      // Check .env.example
      const envExample = await fs.readFile('.env.example', 'utf8');
      if (!envExample.includes('GITHUB_TOKEN')) {
        throw new Error('Missing GITHUB_TOKEN in .env.example');
      }

      // Check package.json dependencies
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const requiredDeps = ['semver', 'node-fetch', 'yauzl', 'sqlite3'];
      
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep]) {
          throw new Error(`Missing required dependency: ${dep}`);
        }
      }

      // Check build configuration
      if (!packageJson.build || !packageJson.build.files) {
        this.addIssue('medium', 'Build Config', 'Build configuration may be incomplete', 
          'Verify electron-builder configuration includes all necessary files');
      }

      // Check GitHub publish configuration
      if (packageJson.build.publish.owner === 'your-github-username') {
        this.addIssue('high', 'GitHub Config', 'GitHub owner not configured in package.json',
          'Update package.json build.publish.owner with actual GitHub username');
      }
    });
  }

  // Test 2: SecurityManager
  async testSecurityManager() {
    await this.runTest('SecurityManager Initialization', async () => {
      const securityManager = new SecurityManager();
      await securityManager.initialize();
      
      // Test token validation
      const validTokens = [
        'ghp_1234567890123456789012345678901234567890',
        'github_pat_11ABCDEFG0123456789_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
      ];
      
      const invalidTokens = [
        'invalid-token',
        'ghp_short',
        '',
        null
      ];

      for (const token of validTokens) {
        if (!securityManager.validateGitHubTokenFormat(token)) {
          throw new Error(`Valid token rejected: ${token.substring(0, 10)}...`);
        }
      }

      for (const token of invalidTokens) {
        if (securityManager.validateGitHubTokenFormat(token)) {
          throw new Error(`Invalid token accepted: ${token}`);
        }
      }
    });
  }

  // Test 3: GitHubService
  async testGitHubService() {
    await this.runTest('GitHubService Configuration', async () => {
      const githubService = new GitHubService();
      
      // Check configuration
      if (!githubService.config.owner || githubService.config.owner === '') {
        this.addIssue('high', 'GitHubService', 'GitHub owner not configured',
          'Set GITHUB_OWNER environment variable');
      }

      if (!githubService.config.repo || githubService.config.repo === 'puenkaset') {
        this.addIssue('medium', 'GitHubService', 'Using default repository name',
          'Verify GITHUB_REPO environment variable is set correctly');
      }

      // Test rate limit handling
      if (githubService.rateLimitRemaining === 5000) {
        this.addIssue('low', 'GitHubService', 'Rate limit not initialized from actual API',
          'Consider calling checkRateLimit() during initialization');
      }
    });
  }

  // Test 4: DownloadManager
  async testDownloadManager() {
    await this.runTest('DownloadManager Functionality', async () => {
      const downloadManager = new DownloadManager();
      
      // Test configuration
      if (downloadManager.downloadConfig.timeout < 30000) {
        this.addIssue('medium', 'DownloadManager', 'Download timeout may be too short for large files',
          'Consider increasing timeout for slower connections');
      }

      // Test download ID generation
      const id1 = downloadManager._generateDownloadId();
      const id2 = downloadManager._generateDownloadId();
      
      if (id1 === id2) {
        throw new Error('Download ID generation not unique');
      }

      // Test active downloads tracking
      const activeDownloads = downloadManager.getActiveDownloads();
      if (!Array.isArray(activeDownloads)) {
        throw new Error('getActiveDownloads() should return an array');
      }
    });
  }

  // Test 5: DatabaseMigrator
  async testDatabaseMigrator() {
    await this.runTest('DatabaseMigrator Setup', async () => {
      const dbPath = path.join(__dirname, 'test.db');
      const migrator = new DatabaseMigrator(dbPath);
      
      // Test migrations loading
      await migrator.initialize();
      
      if (migrator.migrations.length === 0) {
        this.addIssue('medium', 'DatabaseMigrator', 'No migrations loaded',
          'Verify migrations are properly exported from migrations/index.js');
      }

      // Test migration validation
      const isValid = await migrator.validateMigrationScripts();
      if (!isValid) {
        throw new Error('Migration scripts validation failed');
      }

      // Clean up test database
      try {
        await fs.unlink(dbPath);
      } catch {
        // File might not exist
      }
    });
  }

  // Test 6: Migration Scripts
  async testMigrationScripts() {
    await this.runTest('Migration Scripts Validation', async () => {
      if (migrations.length === 0) {
        throw new Error('No migrations found');
      }

      for (const migration of migrations) {
        // Check required properties
        if (!migration.version) {
          throw new Error(`Migration missing version: ${JSON.stringify(migration)}`);
        }
        
        if (!migration.description) {
          throw new Error(`Migration ${migration.version} missing description`);
        }
        
        if (typeof migration.up !== 'function') {
          throw new Error(`Migration ${migration.version} missing or invalid up function`);
        }

        // Check version format
        const versionRegex = /^\d+\.\d+\.\d+$/;
        if (!versionRegex.test(migration.version)) {
          throw new Error(`Migration ${migration.version} has invalid version format`);
        }

        // Warn about missing rollback
        if (!migration.down || typeof migration.down !== 'function') {
          this.addIssue('low', 'Migration', `Migration ${migration.version} has no rollback function`,
            'Consider implementing rollback functionality for better error recovery');
        }
      }
    });
  }

  // Test 7: UpdateManager Integration
  async testUpdateManager() {
    await this.runTest('UpdateManager Integration', async () => {
      const updateManager = new UpdateManager();
      
      // Test initial state
      if (updateManager.currentState !== 'idle') {
        throw new Error(`Expected initial state 'idle', got '${updateManager.currentState}'`);
      }

      // Test configuration
      const config = updateManager.getUpdateConfig();
      if (!config || typeof config !== 'object') {
        throw new Error('UpdateManager configuration not accessible');
      }

      // Test service initialization
      if (!updateManager.githubService) {
        throw new Error('GitHubService not initialized');
      }
      
      if (!updateManager.downloadManager) {
        throw new Error('DownloadManager not initialized');
      }
      
      if (!updateManager.databaseMigrator) {
        throw new Error('DatabaseMigrator not initialized');
      }
      
      if (!updateManager.securityManager) {
        throw new Error('SecurityManager not initialized');
      }
    });
  }

  // Test 8: Critical Issues Detection
  async testCriticalIssues() {
    await this.runTest('Critical Issues Detection', async () => {
      const issues = [];

      // Check for crypto usage in SecurityManager
      try {
        const securityManagerCode = await fs.readFile('./src/main/services/SecurityManager.js', 'utf8');
        if (securityManagerCode.includes('createCipher') && securityManagerCode.includes('createDecipher')) {
          issues.push('SecurityManager uses deprecated crypto.createCipher/createDecipher');
          this.addIssue('high', 'SecurityManager', 'Uses deprecated crypto functions',
            'Replace createCipher/createDecipher with createCipherGCM/createDecipherGCM');
        }
      } catch (error) {
        issues.push(`Could not analyze SecurityManager code: ${error.message}`);
      }

      // Check for proper error handling in UpdateManager
      try {
        const updateManagerCode = await fs.readFile('./src/main/services/UpdateManager.js', 'utf8');
        if (!updateManagerCode.includes('try') || !updateManagerCode.includes('catch')) {
          issues.push('UpdateManager may lack proper error handling');
        }
      } catch (error) {
        issues.push(`Could not analyze UpdateManager code: ${error.message}`);
      }

      // Check for file path validation
      try {
        const downloadManagerCode = await fs.readFile('./src/main/services/DownloadManager.js', 'utf8');
        if (!downloadManagerCode.includes('path.resolve') && !downloadManagerCode.includes('startsWith')) {
          this.addIssue('medium', 'DownloadManager', 'May lack path traversal protection',
            'Implement proper file path validation to prevent directory traversal attacks');
        }
      } catch (error) {
        issues.push(`Could not analyze DownloadManager code: ${error.message}`);
      }

      if (issues.length > 0) {
        this.log(`Found ${issues.length} potential critical issues`, 'warning');
      }
    });
  }

  // Test 9: File Structure Validation
  async testFileStructure() {
    await this.runTest('File Structure Validation', async () => {
      const requiredFiles = [
        'src/main/services/UpdateManager.js',
        'src/main/services/GitHubService.js',
        'src/main/services/SecurityManager.js',
        'src/main/services/DownloadManager.js',
        'src/main/services/DatabaseMigrator.js',
        'src/main/handlers/updateHandlers.js',
        'src/main/migrations/index.js',
        'src/main/config/update.config.js',
        'src/components/Update/UpdateController.jsx',
        'src/components/Update/UpdateNotification.jsx',
        'src/components/Update/UpdateProgress.jsx',
        'src/components/Settings/UpdateSection.jsx'
      ];

      for (const file of requiredFiles) {
        try {
          await fs.access(file);
        } catch (error) {
          throw new Error(`Required file missing: ${file}. Error: ${error.message}`);
        }
      }

      // Check for proper imports
      const mainJs = await fs.readFile('main.js', 'utf8');
      if (!mainJs.includes('setupUpdateHandlers')) {
        throw new Error('main.js does not import setupUpdateHandlers');
      }

      const preloadJs = await fs.readFile('preload.js', 'utf8');
      if (!preloadJs.includes('updateApi')) {
        throw new Error('preload.js does not expose updateApi');
      }
    });
  }

  // Test 10: Environment Configuration
  async testEnvironmentConfiguration() {
    await this.runTest('Environment Configuration', async () => {
      // Check if .env file exists (optional but recommended)
      try {
        await fs.access('.env');
        this.log('Found .env file', 'info');
      } catch (error) {
        this.addIssue('medium', 'Environment', `.env file not found: ${error.message}`,
          'Create .env file based on .env.example for local configuration');
      }

      // Check environment variables
      const requiredEnvVars = ['GITHUB_OWNER', 'GITHUB_REPO'];
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          this.addIssue('high', 'Environment', `Missing environment variable: ${envVar}`,
            `Set ${envVar} environment variable or create .env file`);
        }
      }

      if (!process.env.GITHUB_TOKEN) {
        this.addIssue('medium', 'Environment', 'GITHUB_TOKEN not set',
          'Set GITHUB_TOKEN for private repository access');
      }
    });
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting Puenkaset Updater System Tests', 'info');
    this.log('=' * 60, 'info');

    const startTime = Date.now();

    await this.testConfiguration();
    await this.testSecurityManager();
    await this.testGitHubService();
    await this.testDownloadManager();
    await this.testDatabaseMigrator();
    await this.testMigrationScripts();
    await this.testUpdateManager();
    await this.testCriticalIssues();
    await this.testFileStructure();
    await this.testEnvironmentConfiguration();

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    this.log('=' * 60, 'info');
    this.log('📊 TEST RESULTS SUMMARY', 'info');
    this.log('=' * 60, 'info');
    this.log(`✅ Tests Passed: ${this.testResults.passed}`, 'success');
    this.log(`❌ Tests Failed: ${this.testResults.failed}`, 'error');
    this.log(`⏱️  Duration: ${duration.toFixed(2)}s`, 'info');
    this.log(`🐛 Issues Found: ${this.testResults.issues.length}`, 'warning');

    if (this.testResults.issues.length > 0) {
      this.log('\n🔍 DETAILED ISSUES:', 'warning');
      this.log('-' * 40, 'info');
      
      const groupedIssues = this.testResults.issues.reduce((acc, issue) => {
        if (!acc[issue.severity]) acc[issue.severity] = [];
        acc[issue.severity].push(issue);
        return acc;
      }, {});

      for (const [severity, issues] of Object.entries(groupedIssues)) {
        this.log(`\n${severity.toUpperCase()} SEVERITY (${issues.length} issues):`, 'warning');
        issues.forEach((issue, index) => {
          this.log(`${index + 1}. [${issue.component}] ${issue.description}`, 'error');
          if (issue.recommendation) {
            this.log(`   💡 Recommendation: ${issue.recommendation}`, 'info');
          }
        });
      }
    }

    if (this.testResults.recommendations.length > 0) {
      this.log('\n💡 RECOMMENDATIONS:', 'info');
      this.log('-' * 40, 'info');
      this.testResults.recommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`, 'info');
      });
    }

    return this.testResults;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new UpdaterSystemTester();
  tester.runAllTests()
    .then((results) => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export { UpdaterSystemTester };