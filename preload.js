/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addProduct: (product) => ipcRenderer.invoke('addProduct', product),
  editProduct: (id, product) => ipcRenderer.invoke('editProduct', id, product),
  getProducts: () => ipcRenderer.invoke('getProducts'),
  deleteProduct: (id) => ipcRenderer.invoke('deleteProduct', id),
  printLabel: (product) => ipcRenderer.invoke('printLabel', product),
  searchProducts: (query) => ipcRenderer.invoke('searchProducts', query),
  completeSale: (cartItems) => ipcRenderer.invoke('completeSale', cartItems),
  printReceipt: (saleData, cartItems) => ipcRenderer.invoke('printReceipt', saleData, cartItems),
  previewReceipt: (saleData, cartItems) => ipcRenderer.invoke('previewReceipt', saleData, cartItems),
  backupData: () => ipcRenderer.invoke('backupData'),
  restoreData: () => ipcRenderer.invoke('restoreData'),
  getSalesHistory: (limit) => ipcRenderer.invoke('getSalesHistory', limit),
  getSaleDetails: (saleId) => ipcRenderer.invoke('getSaleDetails', saleId),
}); 