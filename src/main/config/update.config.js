import process from 'process';

export const updateConfig = {
  // General update settings
  autoCheck: true, // Check for updates on app startup
  checkInterval: 24 * 60 * 60 * 1000, // How often to check for updates (24 hours)
  autoDownload: false, // Automatically download updates when available
  autoInstall: false, // Automatically install updates after download
  allowPrerelease: false, // Allow installation of pre-release versions

  // Backup settings
  backupBeforeUpdate: true, // Create a database backup before starting update
  maxBackups: 5, // Maximum number of database backups to keep

  // GitHub repository settings
  github: {
    owner: process.env.GITHUB_OWNER || 'your-github-username',
    repo: process.env.GITHUB_REPO || 'puenkaset',
    token: process.env.GITHUB_TOKEN || '', // Personal Access Token (set via environment variable)
    apiBase: 'https://api.github.com',
    timeout: 30000, // API request timeout in ms
    retries: 3 // Number of retries for API requests
  },

  // Download settings
  download: {
    timeout: 60000, // Download timeout in ms
    retries: 5, // Number of retries for downloads
    retryDelay: 5000, // Delay between retries in ms
    chunkSize: 1024 * 1024 // Download chunk size (1MB)
  },

  // UI settings
  ui: {
    showUpdateNotification: true, // Show a notification when update is available
    showUpdateProgress: true, // Show progress during download/installation
    confirmBeforeInstall: true // Ask for user confirmation before installing
  },

  // Logging settings
  logging: {
    level: 'info', // 'info', 'warn', 'error', 'debug'
    filePath: 'update.log' // Log file path
  }
};