import { ipcMain, BrowserWindow } from 'electron';
import { UpdateManager } from '../services/UpdateManager.js';

let updateManager = null;

export function setupUpdateHandlers() {
  // Initialize UpdateManager
  updateManager = new UpdateManager();
  
  // Initialize the update manager
  updateManager.initialize().catch(error => {
    console.error('Failed to initialize UpdateManager:', error);
  });

  // Set up event forwarding from main to renderer
  updateManager.on('updateAvailable', (updateInfo) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:available', updateInfo);
    });
  });

  updateManager.on('downloadProgress', (progress) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:downloadProgress', progress);
    });
  });

  updateManager.on('downloadComplete', (info) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:downloadComplete', info);
    });
  });

  updateManager.on('installProgress', (progress) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:installProgress', progress);
    });
  });

  updateManager.on('updateComplete', (info) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:complete', info);
    });
  });

  updateManager.on('updateError', (error) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:error', error);
    });
  });

  updateManager.on('updateCancelled', () => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:cancelled');
    });
  });

  updateManager.on('updateRolledBack', () => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:rolledBack');
    });
  });

  updateManager.on('stateChanged', (stateInfo) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:stateChanged', stateInfo);
    });
  });

  updateManager.on('configChanged', (config) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:configChanged', config);
    });
  });

  // Update checking
  ipcMain.handle('update:check', async () => {
    try {
      return await updateManager.checkForUpdates();
    } catch (error) {
      throw new Error(`Update check failed: ${error.message}`);
    }
  });

  // Update download
  ipcMain.handle('update:download', async () => {
    try {
      await updateManager.downloadUpdate();
      return { success: true };
    } catch (error) {
      throw new Error(`Update download failed: ${error.message}`);
    }
  });

  // Update installation
  ipcMain.handle('update:install', async () => {
    try {
      await updateManager.installUpdate();
      return { success: true };
    } catch (error) {
      throw new Error(`Update installation failed: ${error.message}`);
    }
  });

  // Download and install in one step
  ipcMain.handle('update:downloadAndInstall', async () => {
    try {
      await updateManager.downloadUpdate();
      await updateManager.installUpdate();
      return { success: true };
    } catch (error) {
      throw new Error(`Update process failed: ${error.message}`);
    }
  });

  // Cancel update
  ipcMain.handle('update:cancel', async () => {
    try {
      await updateManager.cancelUpdate();
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to cancel update: ${error.message}`);
    }
  });

  // Rollback update
  ipcMain.handle('update:rollback', async () => {
    try {
      await updateManager.rollbackUpdate();
      return { success: true };
    } catch (error) {
      throw new Error(`Update rollback failed: ${error.message}`);
    }
  });

  // Get update status
  ipcMain.handle('update:getStatus', async () => {
    try {
      return updateManager.getUpdateStatus();
    } catch (error) {
      throw new Error(`Failed to get update status: ${error.message}`);
    }
  });

  // Configuration management
  ipcMain.handle('update:getConfig', async () => {
    try {
      return updateManager.getUpdateConfig();
    } catch (error) {
      throw new Error(`Failed to get update config: ${error.message}`);
    }
  });

  ipcMain.handle('update:setConfig', async (event, config) => {
    try {
      updateManager.setUpdateConfig(config);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to set update config: ${error.message}`);
    }
  });

  // GitHub token management
  ipcMain.handle('update:setGitHubToken', async (event, token) => {
    try {
      await updateManager.setGitHubToken(token);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to set GitHub token: ${error.message}`);
    }
  });

  ipcMain.handle('update:validateGitHubToken', async (event, token) => {
    try {
      const isValid = updateManager.securityManager.validateGitHubTokenFormat(token);
      if (isValid) {
        // Temporarily set token to validate with GitHub
        const originalToken = updateManager.githubService.config.token;
        updateManager.githubService.setAuthToken(token);
        const isValidWithGitHub = await updateManager.githubService.validateToken();
        updateManager.githubService.setAuthToken(originalToken);
        return { valid: isValidWithGitHub };
      }
      return { valid: false };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  });

  // Manual restart
  ipcMain.handle('update:restart', async () => {
    try {
      updateManager.restartApplication();
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to restart application: ${error.message}`);
    }
  });

  // Database migration utilities
  ipcMain.handle('update:getCurrentSchemaVersion', async () => {
    try {
      return await updateManager.databaseMigrator.getCurrentSchemaVersion();
    } catch (error) {
      throw new Error(`Failed to get schema version: ${error.message}`);
    }
  });

  ipcMain.handle('update:validateDatabase', async () => {
    try {
      const isValid = await updateManager.databaseMigrator.validateDatabaseIntegrity();
      return { valid: isValid };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  });

  ipcMain.handle('update:createDatabaseBackup', async () => {
    try {
      const backupPath = await updateManager.databaseMigrator.createBackup();
      return { success: true, backupPath };
    } catch (error) {
      throw new Error(`Failed to create database backup: ${error.message}`);
    }
  });

  // Development/testing utilities
  ipcMain.handle('update:checkGitHubConnection', async () => {
    try {
      const rateLimit = await updateManager.githubService.checkRateLimit();
      return { 
        connected: true, 
        rateLimit: {
          remaining: rateLimit.remaining,
          limit: rateLimit.limit,
          reset: rateLimit.reset
        }
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  });

  console.log('Update handlers setup completed');
}

// Export updateManager for testing purposes
export { updateManager };