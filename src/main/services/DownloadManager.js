import fs from 'fs/promises';
import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import fetch from 'node-fetch';
import yauzl from 'yauzl';

export class DownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadConfig = {
      timeout: 30000,
      retries: 3,
      chunkSize: 1024 * 1024, // 1MB chunks
      resumeSupport: true
    };
  }

  /**
   * Download a file with progress tracking
   * @param {string} url - Download URL
   * @param {string} destination - Destination file path
   * @param {Object} options - Download options
   * @returns {Promise<string>} Downloaded file path
   */
  async downloadFile(url, destination, options = {}) {
    const downloadId = this._generateDownloadId();
    const config = { ...this.downloadConfig, ...options };
    
    try {
      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destination), { recursive: true });

      // Check if partial download exists
      let startByte = 0;
      if (config.resumeSupport) {
        try {
          const stats = await fs.stat(destination);
          startByte = stats.size;
        } catch {
          // File doesn't exist, start from beginning
        }
      }

      const downloadInfo = {
        id: downloadId,
        url,
        destination,
        startByte,
        totalBytes: 0,
        downloadedBytes: startByte,
        progress: 0,
        speed: 0,
        eta: 0,
        status: 'pending',
        startTime: Date.now(),
        lastProgressTime: Date.now()
      };

      this.activeDownloads.set(downloadId, downloadInfo);

      // Start download with retry logic
      let attempt = 0;
      while (attempt < config.retries) {
        try {
          await this._performDownload(downloadInfo, config);
          break;
        } catch (error) {
          attempt++;
          if (attempt >= config.retries) {
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, config.retryDelay || 5000));
          console.log(`Download retry ${attempt}/${config.retries} for ${url}`);
        }
      }

      this.activeDownloads.delete(downloadId);
      return destination;

    } catch (error) {
      this.activeDownloads.delete(downloadId);
      this.emit('downloadError', { downloadId, error: error.message });
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Resume a paused download
   * @param {string} downloadId - Download ID
   * @returns {Promise<void>}
   */
  async resumeDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (!downloadInfo) {
      throw new Error('Download not found');
    }

    if (downloadInfo.status === 'paused') {
      downloadInfo.status = 'downloading';
      await this._performDownload(downloadInfo, this.downloadConfig);
    }
  }

  /**
   * Cancel an active download
   * @param {string} downloadId - Download ID
   * @returns {Promise<void>}
   */
  async cancelDownload(downloadId) {
    const downloadInfo = this.activeDownloads.get(downloadId);
    if (downloadInfo) {
      downloadInfo.status = 'cancelled';
      this.activeDownloads.delete(downloadId);
      
      // Clean up partial file
      try {
        await fs.unlink(downloadInfo.destination);
      } catch {
        // File might not exist
      }
      
      this.emit('downloadCancelled', { downloadId });
    }
  }

  /**
   * Verify download integrity using hash
   * @param {string} filePath - Path to downloaded file
   * @param {string} expectedHash - Expected file hash
   * @param {string} algorithm - Hash algorithm (default: sha256)
   * @returns {Promise<boolean>} True if file is valid
   */
  async verifyDownload(filePath, expectedHash, algorithm = 'sha256') {
    try {
      const actualHash = await this._calculateFileHash(filePath, algorithm);
      return actualHash.toLowerCase() === expectedHash.toLowerCase();
    } catch (error) {
      console.error('Download verification failed:', error);
      return false;
    }
  }

  /**
   * Get download progress for a specific download
   * @param {string} downloadId - Download ID
   * @returns {Object|null} Download progress information
   */
  getDownloadProgress(downloadId) {
    return this.activeDownloads.get(downloadId) || null;
  }

  /**
   * Get all active downloads
   * @returns {Array} Array of download information
   */
  getActiveDownloads() {
    return Array.from(this.activeDownloads.values());
  }

  /**
   * Extract ZIP archive
   * @param {string} archivePath - Path to ZIP file
   * @param {string} destination - Extraction destination
   * @returns {Promise<void>}
   */
  async extractArchive(archivePath, destination) {
    return new Promise((resolve, reject) => {
      yauzl.open(archivePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new Error(`Failed to open archive: ${err.message}`));
          return;
        }

        zipfile.readEntry();

        zipfile.on('entry', async (entry) => {
          const entryPath = path.join(destination, entry.fileName);
          
          // Validate path to prevent directory traversal
          if (!entryPath.startsWith(destination)) {
            reject(new Error('Invalid archive entry path'));
            return;
          }

          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            await fs.mkdir(entryPath, { recursive: true });
            zipfile.readEntry();
          } else {
            // File entry
            await fs.mkdir(path.dirname(entryPath), { recursive: true });
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              const writeStream = createWriteStream(entryPath);
              readStream.pipe(writeStream);
              
              writeStream.on('close', () => {
                zipfile.readEntry();
              });
              
              writeStream.on('error', reject);
            });
          }
        });

        zipfile.on('end', resolve);
        zipfile.on('error', reject);
      });
    });
  }

  /**
   * Clean up old download files
   * @param {string} downloadDir - Download directory
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {Promise<void>}
   */
  async cleanupDownloads(downloadDir, maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const files = await fs.readdir(downloadDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(downloadDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old download: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup downloads:', error);
    }
  }

  /**
   * Perform the actual download
   * @param {Object} downloadInfo - Download information
   * @param {Object} config - Download configuration
   * @returns {Promise<void>}
   * @private
   */
  async _performDownload(downloadInfo, config) {
    const headers = {};
    
    // Add range header for resume support
    if (downloadInfo.startByte > 0) {
      headers['Range'] = `bytes=${downloadInfo.startByte}-`;
    }

    const response = await fetch(downloadInfo.url, {
      headers,
      timeout: config.timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get total file size
    const contentLength = response.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) + downloadInfo.startByte : 0;
    
    downloadInfo.totalBytes = totalBytes;
    downloadInfo.status = 'downloading';

    // Create write stream (append mode for resume)
    const writeStream = createWriteStream(downloadInfo.destination, { 
      flags: downloadInfo.startByte > 0 ? 'a' : 'w' 
    });

    return new Promise((resolve, reject) => {
      let lastProgressUpdate = Date.now();
      let lastDownloadedBytes = downloadInfo.downloadedBytes;

      response.body.on('data', (chunk) => {
        if (downloadInfo.status === 'cancelled') {
          writeStream.destroy();
          reject(new Error('Download cancelled'));
          return;
        }

        downloadInfo.downloadedBytes += chunk.length;
        
        // Update progress every 100ms or 1% progress
        const now = Date.now();
        if (now - lastProgressUpdate > 100 || 
            (downloadInfo.totalBytes && downloadInfo.downloadedBytes % Math.floor(downloadInfo.totalBytes / 100) === 0)) {
          
          const timeDiff = (now - lastProgressUpdate) / 1000;
          const bytesDiff = downloadInfo.downloadedBytes - lastDownloadedBytes;
          
          downloadInfo.speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
          downloadInfo.progress = downloadInfo.totalBytes ? 
            (downloadInfo.downloadedBytes / downloadInfo.totalBytes) * 100 : 0;
          downloadInfo.eta = downloadInfo.speed > 0 ? 
            (downloadInfo.totalBytes - downloadInfo.downloadedBytes) / downloadInfo.speed : 0;
          
          lastProgressUpdate = now;
          lastDownloadedBytes = downloadInfo.downloadedBytes;
          
          this.emit('downloadProgress', { ...downloadInfo });
        }
      });

      response.body.on('error', (error) => {
        writeStream.destroy();
        reject(error);
      });

      response.body.on('end', () => {
        downloadInfo.status = 'completed';
        downloadInfo.progress = 100;
        this.emit('downloadComplete', { ...downloadInfo });
        resolve();
      });

      response.body.pipe(writeStream);
    });
  }

  /**
   * Calculate file hash
   * @param {string} filePath - Path to file
   * @param {string} algorithm - Hash algorithm
   * @returns {Promise<string>} File hash
   * @private
   */
  async _calculateFileHash(filePath, algorithm = 'sha256') {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const stream = createReadStream(filePath);

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', reject);
    });
  }

  /**
   * Generate unique download ID
   * @returns {string} Download ID
   * @private
   */
  _generateDownloadId() {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}