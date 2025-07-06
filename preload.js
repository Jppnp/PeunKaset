/* eslint-disable no-undef */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  addProduct: (product) => ipcRenderer.invoke('addProduct', product),
  editProduct: (id, product) => ipcRenderer.invoke('editProduct', id, product),
  getProducts: () => ipcRenderer.invoke('getProducts'),
  deleteProduct: (id) => ipcRenderer.invoke('deleteProduct', id),
  printLabel: (product) => ipcRenderer.invoke('printLabel', product),
  searchProducts: (query) => ipcRenderer.invoke('searchProducts', query),
}); 