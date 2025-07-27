import fetch from 'node-fetch';
import pkg from 'electron';
const { app } = pkg;
import process from 'process';

export class GitHubService {
  constructor() {
    this.config = {
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || 'puenkaset',
      token: process.env.GITHUB_TOKEN || '',
      apiBase: 'https://api.github.com'
    };
    this.rateLimitRemaining = 5000;
    this.rateLimitReset = Date.now();
  }

  /**
   * Get the latest release from GitHub
   * @returns {Promise<Object>} Release information
   */
  async getLatestRelease() {
    const url = `${this.config.apiBase}/repos/${this.config.owner}/${this.config.repo}/releases/latest`;
    
    try {
      const response = await this._makeRequest(url);
      const release = await response.json();
      
      return {
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        publishedAt: release.published_at,
        assets: release.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          downloadUrl: asset.browser_download_url,
          size: asset.size,
          contentType: asset.content_type
        }))
      };
    } catch (error) {
      throw new Error(`Failed to fetch latest release: ${error.message}`);
    }
  }

  /**
   * Get a specific release by tag
   * @param {string} tag - Release tag
   * @returns {Promise<Object>} Release information
   */
  async getReleaseByTag(tag) {
    const url = `${this.config.apiBase}/repos/${this.config.owner}/${this.config.repo}/releases/tags/${tag}`;
    
    try {
      const response = await this._makeRequest(url);
      const release = await response.json();
      
      return {
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        publishedAt: release.published_at,
        assets: release.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          downloadUrl: asset.browser_download_url,
          size: asset.size,
          contentType: asset.content_type
        }))
      };
    } catch (error) {
      throw new Error(`Failed to fetch release ${tag}: ${error.message}`);
    }
  }

  /**
   * Download an asset from a release
   * @param {number} assetId - Asset ID
   * @param {string} destination - Download destination path
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<void>}
   */
  async downloadAsset(assetId, destination, onProgress) {
    const url = `${this.config.apiBase}/repos/${this.config.owner}/${this.config.repo}/releases/assets/${assetId}`;
    
    try {
      const response = await this._makeRequest(url, {
        headers: {
          'Accept': 'application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      const totalSize = parseInt(response.headers.get('content-length'), 10);
      let downloadedSize = 0;

      const fs = await import('fs');
      const writeStream = fs.createWriteStream(destination);

      return new Promise((resolve, reject) => {
        response.body.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (onProgress) {
            onProgress({
              downloadedBytes: downloadedSize,
              totalBytes: totalSize,
              progress: totalSize ? (downloadedSize / totalSize) * 100 : 0
            });
          }
        });

        response.body.on('error', reject);
        response.body.on('end', resolve);
        response.body.pipe(writeStream);
      });
    } catch (error) {
      throw new Error(`Failed to download asset: ${error.message}`);
    }
  }

  /**
   * Validate GitHub token
   * @returns {Promise<boolean>} Token validity
   */
  async validateToken() {
    if (!this.config.token) {
      return false;
    }

    try {
      const url = `${this.config.apiBase}/user`;
      const response = await this._makeRequest(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Set authentication token
   * @param {string} token - GitHub Personal Access Token
   */
  setAuthToken(token) {
    this.config.token = token;
  }

  /**
   * Check current rate limit status
   * @returns {Promise<Object>} Rate limit information
   */
  async checkRateLimit() {
    try {
      const url = `${this.config.apiBase}/rate_limit`;
      const response = await this._makeRequest(url);
      const data = await response.json();
      
      this.rateLimitRemaining = data.rate.remaining;
      this.rateLimitReset = data.rate.reset * 1000; // Convert to milliseconds
      
      return {
        remaining: data.rate.remaining,
        limit: data.rate.limit,
        reset: new Date(data.rate.reset * 1000)
      };
    } catch (error) {
      throw new Error(`Failed to check rate limit: ${error.message}`);
    }
  }

  /**
   * Wait for rate limit reset if needed
   * @returns {Promise<void>}
   */
  async waitForRateLimit() {
    if (this.rateLimitRemaining <= 1 && Date.now() < this.rateLimitReset) {
      const waitTime = this.rateLimitReset - Date.now();
      console.log(`Rate limit exceeded, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Make authenticated request to GitHub API
   * @param {string} url - API endpoint URL
   * @param {Object} options - Request options
   * @returns {Promise<Response>} Fetch response
   * @private
   */
  async _makeRequest(url, options = {}) {
    await this.waitForRateLimit();

    const headers = {
      'User-Agent': `Puenkaset-POS-Updater/${app.getVersion()}`,
      ...options.headers
    };

    if (this.config.token) {
      headers['Authorization'] = `token ${this.config.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      timeout: 30000
    });

    // Update rate limit info from response headers
    if (response.headers.get('x-ratelimit-remaining')) {
      this.rateLimitRemaining = parseInt(response.headers.get('x-ratelimit-remaining'), 10);
      this.rateLimitReset = parseInt(response.headers.get('x-ratelimit-reset'), 10) * 1000;
    }

    if (!response.ok && response.status === 401) {
      throw new Error('GitHub authentication failed. Please check your token.');
    }

    if (!response.ok && response.status === 403) {
      throw new Error('GitHub API rate limit exceeded or access forbidden.');
    }

    if (!response.ok && response.status === 404) {
      throw new Error('Repository or release not found. Please check your configuration.');
    }

    return response;
  }
}
