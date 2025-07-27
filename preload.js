/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Existing APIs
  addProduct: (product) => ipcRenderer.invoke('addProduct', product),
  editProduct: (id, product) => ipcRenderer.invoke('editProduct', id, product),
  getProducts: () => ipcRenderer.invoke('getProducts'),
  deleteProduct: (id) => ipcRenderer.invoke('deleteProduct', id),
  searchProducts: (query) => ipcRenderer.invoke('searchProducts', query),
  completeSale: (cartItems, remark) => ipcRenderer.invoke('completeSale', cartItems, remark),
  printReceipt: (saleData, cartItems) => ipcRenderer.invoke('printReceipt', saleData, cartItems),
  previewReceipt: (saleData, cartItems) => ipcRenderer.invoke('previewReceipt', saleData, cartItems),
  backupData: () => ipcRenderer.invoke('backupData'),
  restoreData: () => ipcRenderer.invoke('restoreData'),
  getSalesHistory: (limit) => ipcRenderer.invoke('getSalesHistory', limit),
  getSaleDetails: (saleId) => ipcRenderer.invoke('getSaleDetails', saleId),
  deleteSale: (saleId) => ipcRenderer.invoke('deleteSale', saleId),
  deleteSaleItem: (saleItemId) => ipcRenderer.invoke('deleteSaleItem', saleItemId),
  exportSalesCSV: (params) => ipcRenderer.invoke('exportSalesCSV', params),
  focusFix: () => ipcRenderer.send('focus-fix'),

  // Update APIs
  updateApi: {
    // Core update operations
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    downloadAndInstall: () => ipcRenderer.invoke('update:downloadAndInstall'),
    cancelUpdate: () => ipcRenderer.invoke('update:cancel'),
    rollbackUpdate: () => ipcRenderer.invoke('update:rollback'),
    restartApplication: () => ipcRenderer.invoke('update:restart'),

    // Status and configuration
    getUpdateStatus: () => ipcRenderer.invoke('update:getStatus'),
    getConfig: () => ipcRenderer.invoke('update:getConfig'),
    setConfig: (config) => ipcRenderer.invoke('update:setConfig', config),

    // GitHub token management
    setGitHubToken: (token) => ipcRenderer.invoke('update:setGitHubToken', token),
    validateGitHubToken: (token) => ipcRenderer.invoke('update:validateGitHubToken', token),

    // Database utilities
    getCurrentSchemaVersion: () => ipcRenderer.invoke('update:getCurrentSchemaVersion'),
    validateDatabase: () => ipcRenderer.invoke('update:validateDatabase'),
    createDatabaseBackup: () => ipcRenderer.invoke('update:createDatabaseBackup'),

    // Development utilities
    checkGitHubConnection: () => ipcRenderer.invoke('update:checkGitHubConnection'),

    // Event listeners
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('update:available', (event, updateInfo) => callback(updateInfo));
    },
    onDownloadProgress: (callback) => {
      ipcRenderer.on('update:downloadProgress', (event, progress) => callback(progress));
    },
    onDownloadComplete: (callback) => {
      ipcRenderer.on('update:downloadComplete', (event, info) => callback(info));
    },
    onInstallProgress: (callback) => {
      ipcRenderer.on('update:installProgress', (event, progress) => callback(progress));
    },
    onUpdateComplete: (callback) => {
      ipcRenderer.on('update:complete', (event, info) => callback(info));
    },
    onUpdateError: (callback) => {
      ipcRenderer.on('update:error', (event, error) => callback(error));
    },
    onUpdateCancelled: (callback) => {
      ipcRenderer.on('update:cancelled', () => callback());
    },
    onUpdateRolledBack: (callback) => {
      ipcRenderer.on('update:rolledBack', () => callback());
    },
    onStateChanged: (callback) => {
      ipcRenderer.on('update:stateChanged', (event, stateInfo) => callback(stateInfo));
    },
    onConfigChanged: (callback) => {
      ipcRenderer.on('update:configChanged', (event, config) => callback(config));
    },

    // Cleanup listeners
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('update:available');
      ipcRenderer.removeAllListeners('update:downloadProgress');
      ipcRenderer.removeAllListeners('update:downloadComplete');
      ipcRenderer.removeAllListeners('update:installProgress');
      ipcRenderer.removeAllListeners('update:complete');
      ipcRenderer.removeAllListeners('update:error');
      ipcRenderer.removeAllListeners('update:cancelled');
      ipcRenderer.removeAllListeners('update:rolledBack');
      ipcRenderer.removeAllListeners('update:stateChanged');
      ipcRenderer.removeAllListeners('update:configChanged');
    }
  }
});