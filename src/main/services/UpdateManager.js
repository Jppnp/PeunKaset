import pkg from 'electron';
const { app, BrowserWindow } = pkg;
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import semver from 'semver';
import process from 'process';
import { GitHubService } from './GitHubService.js';
import { DownloadManager } from './DownloadManager.js';
import { DatabaseMigrator } from './DatabaseMigrator.js';
import { SecurityManager } from './SecurityManager.js';

// Update states
export const UpdateStates = {
  IDLE: 'idle',
  CHECKING: 'checking',
  UPDATE_AVAILABLE: 'update_available',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  INSTALLING: 'installing',
  MIGRATING: 'migrating',
  RESTARTING: 'restarting',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

export class UpdateManager extends EventEmitter {
  constructor() {
    super();
    this.currentVersion = app.getVersion();
    this.updateInProgress = false;
    this.currentState = UpdateStates.IDLE;
    this.updateInfo = null;
    this.downloadPath = path.join(app.getPath('temp'), 'puenkaset-update');
    
    // Initialize services
    this.githubService = new GitHubService();
    this.downloadManager = new DownloadManager();
    this.databaseMigrator = new DatabaseMigrator(path.join(process.cwd(), 'store.db'));
    this.securityManager = new SecurityManager();
    
    // Configuration
    this.config = {
      autoCheck: true,
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours
      autoDownload: false,
      autoInstall: false,
      allowPrerelease: false,
      backupBeforeUpdate: true,
      maxBackups: 5
    };

    this._setupEventListeners();
  }

  /**
   * Initialize the update manager
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      await this.securityManager.initialize();
      await this.databaseMigrator.initialize();
      
      // Load GitHub token if available
      const token = await this.securityManager.getGitHubToken();
      if (token) {
        this.githubService.setAuthToken(token);
      }

      // Ensure download directory exists
      await fs.mkdir(this.downloadPath, { recursive: true });
      
      console.log('UpdateManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize UpdateManager:', error);
      throw error;
    }
  }

  /**
   * Check for available updates
   * @returns {Promise<Object>} Update information
   */
  async checkForUpdates() {
    if (this.updateInProgress) {
      throw new Error('Update already in progress');
    }

    this._setState(UpdateStates.CHECKING);

    try {
      console.log('Checking for updates...');
      console.log(`GitHubService config: owner=${this.githubService.config.owner}, repo=${this.githubService.config.repo}`);
      
      const release = await this.githubService.getLatestRelease();
      const latestVersion = this._cleanVersion(release.tagName);
      const hasUpdate = semver.gt(latestVersion, this.currentVersion);

      this.updateInfo = {
        available: hasUpdate,
        currentVersion: this.currentVersion,
        latestVersion,
        releaseNotes: release.body,
        publishedAt: release.publishedAt,
        downloadUrl: this._getDownloadAsset(release.assets)?.downloadUrl,
        fileSize: this._getDownloadAsset(release.assets)?.size,
        releaseId: release.id
      };

      if (hasUpdate) {
        this._setState(UpdateStates.UPDATE_AVAILABLE);
        this.emit('updateAvailable', this.updateInfo);
        console.log(`Update available: ${this.currentVersion} -> ${latestVersion}`);
      } else {
        this._setState(UpdateStates.IDLE);
        console.log('No updates available');
      }

      return this.updateInfo;

    } catch (error) {
      this._setState(UpdateStates.ERROR);
      this.emit('updateError', { phase: 'check', error: error.message });
      throw new Error(`Update check failed: ${error.message}`);
    }
  }

  /**
   * Download the available update
   * @returns {Promise<void>}
   */
  async downloadUpdate() {
    if (!this.updateInfo || !this.updateInfo.available) {
      throw new Error('No update available to download');
    }

    if (this.updateInProgress) {
      throw new Error('Update already in progress');
    }

    this.updateInProgress = true;
    this._setState(UpdateStates.DOWNLOADING);

    try {
      const downloadUrl = this.updateInfo.downloadUrl;
      const fileName = path.basename(downloadUrl);
      const downloadDestination = path.join(this.downloadPath, fileName);

      console.log(`Downloading update from: ${downloadUrl}`);

      // Set up progress tracking
      this.downloadManager.on('downloadProgress', (progress) => {
        this.emit('downloadProgress', {
          phase: 'downloading',
          progress: progress.progress,
          downloadedBytes: progress.downloadedBytes,
          totalBytes: progress.totalBytes,
          speed: progress.speed,
          eta: progress.eta
        });
      });

      await this.downloadManager.downloadFile(downloadUrl, downloadDestination);

      // Verify download if hash is available
      // Note: GitHub doesn't provide hashes by default, but we can add this later
      
      this.updateInfo.downloadPath = downloadDestination;
      this._setState(UpdateStates.DOWNLOADED);
      this.emit('downloadComplete', { filePath: downloadDestination });
      
      console.log('Update download completed');

    } catch (error) {
      this.updateInProgress = false;
      this._setState(UpdateStates.ERROR);
      this.emit('updateError', { phase: 'download', error: error.message });
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Install the downloaded update
   * @returns {Promise<void>}
   */
  async installUpdate() {
    if (!this.updateInfo || !this.updateInfo.downloadPath) {
      throw new Error('No update downloaded to install');
    }

    if (this.currentState !== UpdateStates.DOWNLOADED) {
      throw new Error('Update not ready for installation');
    }

    this._setState(UpdateStates.INSTALLING);

    try {
      console.log('Starting update installation...');

      // Step 1: Create database backup
      if (this.config.backupBeforeUpdate) {
        this.emit('installProgress', { phase: 'backup', progress: 10, message: 'สำรองข้อมูลฐานข้อมูล...' });
        await this.databaseMigrator.createBackup();
      }

      // Step 2: Apply database migrations
      this._setState(UpdateStates.MIGRATING);
      this.emit('installProgress', { phase: 'migrating', progress: 30, message: 'อัปเดตฐานข้อมูล...' });
      
      const currentSchemaVersion = await this.databaseMigrator.getCurrentSchemaVersion();
      const targetSchemaVersion = this.databaseMigrator.getTargetSchemaVersion(this.updateInfo.latestVersion);
      
      if (semver.gt(targetSchemaVersion, currentSchemaVersion)) {
        const migrations = this.databaseMigrator.getMigrationsToApply(currentSchemaVersion, targetSchemaVersion);
        await this.databaseMigrator.applyMigrations(migrations);
      }

      // Step 3: Extract and install application files
      this.emit('installProgress', { phase: 'installing', progress: 60, message: 'ติดตั้งไฟล์แอปพลิเคชัน...' });
      
      if (this.updateInfo.downloadPath.endsWith('.zip')) {
        const extractPath = path.join(this.downloadPath, 'extracted');
        await this.downloadManager.extractArchive(this.updateInfo.downloadPath, extractPath);
        await this._replaceApplicationFiles(extractPath);
      } else {
        // Handle .exe installer
        await this._runInstaller(this.updateInfo.downloadPath);
      }

      // Step 4: Cleanup
      this.emit('installProgress', { phase: 'cleanup', progress: 90, message: 'ทำความสะอาดไฟล์ชั่วคราว...' });
      await this._cleanupUpdateFiles();
      await this.databaseMigrator.cleanupOldBackups(this.config.maxBackups);

      // Step 5: Prepare for restart
      this._setState(UpdateStates.RESTARTING);
      this.emit('installProgress', { phase: 'complete', progress: 100, message: 'การอัปเดตเสร็จสมบูรณ์' });
      this.emit('updateComplete', { version: this.updateInfo.latestVersion });

      console.log('Update installation completed successfully');

      // Schedule restart
      setTimeout(() => {
        this.restartApplication();
      }, 3000);

    } catch (error) {
      console.error('Update installation failed:', error);
      
      // Attempt rollback
      try {
        await this._rollbackUpdate();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      this.updateInProgress = false;
      this._setState(UpdateStates.ERROR);
      this.emit('updateError', { phase: 'install', error: error.message });
      throw new Error(`Installation failed: ${error.message}`);
    }
  }

  /**
   * Cancel the current update process
   * @returns {Promise<void>}
   */
  async cancelUpdate() {
    if (!this.updateInProgress) {
      return;
    }

    console.log('Cancelling update...');

    try {
      // Cancel any active downloads
      const activeDownloads = this.downloadManager.getActiveDownloads();
      for (const download of activeDownloads) {
        await this.downloadManager.cancelDownload(download.id);
      }

      // Cleanup temporary files
      await this._cleanupUpdateFiles();

      this.updateInProgress = false;
      this._setState(UpdateStates.CANCELLED);
      this.emit('updateCancelled');

    } catch (error) {
      console.error('Failed to cancel update:', error);
    }
  }

  /**
   * Rollback the update
   * @returns {Promise<void>}
   */
  async rollbackUpdate() {
    console.log('Rolling back update...');
    
    try {
      await this._rollbackUpdate();
      this.emit('updateRolledBack');
    } catch (error) {
      this.emit('updateError', { phase: 'rollback', error: error.message });
      throw error;
    }
  }

  /**
   * Get current update status
   * @returns {Object} Update status information
   */
  getUpdateStatus() {
    return {
      state: this.currentState,
      updateInProgress: this.updateInProgress,
      updateInfo: this.updateInfo,
      currentVersion: this.currentVersion
    };
  }

  /**
   * Set update configuration
   * @param {Object} config - Configuration options
   */
  setUpdateConfig(config) {
    this.config = { ...this.config, ...config };
    this.emit('configChanged', this.config);
  }

  /**
   * Get update configuration
   * @returns {Object} Current configuration
   */
  getUpdateConfig() {
    return { ...this.config };
  }

  /**
   * Restart the application
   */
  restartApplication() {
    console.log('Restarting application...');
    app.relaunch();
    app.exit(0);
  }

  /**
   * Set GitHub authentication token
   * @param {string} token - GitHub Personal Access Token
   * @returns {Promise<void>}
   */
  async setGitHubToken(token) {
    if (!this.securityManager.validateGitHubTokenFormat(token)) {
      throw new Error('Invalid GitHub token format');
    }

    await this.securityManager.storeGitHubToken(token);
    this.githubService.setAuthToken(token);
    
    // Validate token
    const isValid = await this.githubService.validateToken();
    if (!isValid) {
      throw new Error('GitHub token validation failed');
    }
  }

  /**
   * Set update state and emit event
   * @param {string} state - New state
   * @private
   */
  _setState(state) {
    const previousState = this.currentState;
    this.currentState = state;
    this.emit('stateChanged', { previousState, currentState: state });
  }

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Handle download manager events
    this.downloadManager.on('downloadError', (error) => {
      this.emit('updateError', { phase: 'download', error: error.error });
    });

    this.downloadManager.on('downloadCancelled', () => {
      this.updateInProgress = false;
      this._setState(UpdateStates.CANCELLED);
    });
  }

  /**
   * Clean version string (remove 'v' prefix)
   * @param {string} version - Version string
   * @returns {string} Cleaned version
   * @private
   */
  _cleanVersion(version) {
    return version.replace(/^v/, '');
  }

  /**
   * Get download asset from release assets
   * @param {Array} assets - Release assets
   * @returns {Object|null} Download asset
   * @private
   */
  _getDownloadAsset(assets) {
    // Look for Windows executable
    const windowsAsset = assets.find(asset => 
      asset.name.endsWith('.exe') || asset.name.endsWith('.zip')
    );
    
    return windowsAsset || assets[0] || null;
  }

  /**
   * Replace application files
   * @param {string} extractPath - Path to extracted files
   * @returns {Promise<void>}
   * @private
   */
  async _replaceApplicationFiles(EXTRACT_PATH) {
    // This is a simplified implementation
    // In a real scenario, you'd need to handle file replacement more carefully
    console.log(`Replacing application files from: ${EXTRACT_PATH}...`);
    
    // For now, we'll just log this step
    // The actual implementation would depend on the update package structure
  }

  /**
   * Run installer executable
   * @param {string} installerPath - Path to installer
   * @returns {Promise<void>}
   * @private
   */
  async _runInstaller(installerPath) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const installer = spawn(installerPath, ['/S'], { // Silent install
        detached: true,
        stdio: 'ignore'
      });

      installer.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Installer exited with code ${code}`));
        }
      });

      installer.on('error', reject);
    });
  }

  /**
   * Rollback update changes
   * @returns {Promise<void>}
   * @private
   */
  async _rollbackUpdate() {
    console.log('Performing update rollback...');
    
    // Restore database from backup
    if (this.databaseMigrator.backupPath) {
      await this.databaseMigrator.restoreFromBackup();
    }

    // Cleanup temporary files
    await this._cleanupUpdateFiles();

    this.updateInProgress = false;
    this._setState(UpdateStates.IDLE);
  }

  /**
   * Cleanup temporary update files
   * @returns {Promise<void>}
   * @private
   */
  async _cleanupUpdateFiles() {
    try {
      const files = await fs.readdir(this.downloadPath);
      for (const file of files) {
        const filePath = path.join(this.downloadPath, file);
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.warn('Failed to cleanup update files:', error);
    }
  }
}