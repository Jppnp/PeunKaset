# Puenkaset POS Updater Implementation Guide

## Quick Start Implementation Plan

This guide provides step-by-step instructions for implementing the updater system based on the comprehensive architecture design in [`puenkaset-updater-architecture.md`](puenkaset-updater-architecture.md).

## Prerequisites

### 1. GitHub Repository Setup
- **Private Repository**: Ensure your repository is private
- **Personal Access Token**: Generate a token with `repo` scope
- **Environment Variables**: Set up secure token storage

### 2. Development Environment
- Node.js 18+
- Electron 37+
- Existing Puenkaset POS application

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

#### Step 1.1: Install Dependencies
```bash
npm install semver node-fetch yauzl
```

#### Step 1.2: Create Core Services Directory Structure
```
src/main/services/
├── UpdateManager.js
├── GitHubService.js
├── DatabaseMigrator.js
├── DownloadManager.js
└── SecurityManager.js
```

#### Step 1.3: Implement GitHub Service
Create [`src/main/services/GitHubService.js`](src/main/services/GitHubService.js):
```javascript
import fetch from 'node-fetch';

export class GitHubService {
  constructor() {
    this.config = {
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      token: process.env.GITHUB_TOKEN,
      apiBase: 'https://api.github.com'
    };
  }

  async getLatestRelease() {
    const url = `${this.config.apiBase}/repos/${this.config.owner}/${this.config.repo}/releases/latest`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.config.token}`,
        'User-Agent': 'Puenkaset-POS-Updater'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return await response.json();
  }
}
```

#### Step 1.4: Create Update Handlers
Create [`src/main/handlers/updateHandlers.js`](src/main/handlers/updateHandlers.js):
```javascript
import { ipcMain, BrowserWindow } from 'electron';
import { UpdateManager } from '../services/UpdateManager.js';

const updateManager = new UpdateManager();

export function setupUpdateHandlers() {
  ipcMain.handle('update:check', async () => {
    return await updateManager.checkForUpdates();
  });

  ipcMain.handle('update:download', async () => {
    return await updateManager.downloadUpdate();
  });

  ipcMain.handle('update:install', async () => {
    return await updateManager.installUpdate();
  });

  // Progress events
  updateManager.onUpdateProgress((progress) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('update:progress', progress);
    });
  });
}
```

#### Step 1.5: Update Main.js
Modify [`main.js`](main.js):
```javascript
// Add import
import { setupUpdateHandlers } from './src/main/handlers/updateHandlers.js';

// Modify setupHandlers function
function setupHandlers() {
  setupProductHandlers();
  setupSalesHandlers();
  setupPrintHandlers();
  setupBackupHandlers();
  setupUpdateHandlers(); // NEW
}
```

#### Step 1.6: Update Preload.js
Modify [`preload.js`](preload.js):
```javascript
contextBridge.exposeInMainWorld('api', {
  // Existing APIs...
  
  // NEW: Update APIs
  updateApi: {
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    onProgress: (callback) => {
      ipcRenderer.on('update:progress', (event, progress) => callback(progress));
    }
  }
});
```

### Phase 2: Database Migration System (Week 2-3)

#### Step 2.1: Create Migration Directory
```
src/main/migrations/
├── index.js
├── 001_add_remark_column.js
└── 002_add_cost_price.js
```

#### Step 2.2: Implement Migration Framework
Create [`src/main/migrations/index.js`](src/main/migrations/index.js):
```javascript
import migration001 from './001_add_remark_column.js';
import migration002 from './002_add_cost_price.js';

export const migrations = [
  migration001,
  migration002
];

export function getMigrationsForVersion(fromVersion, toVersion) {
  // Implementation to filter applicable migrations
  return migrations.filter(migration => {
    // Version comparison logic
    return semver.gt(migration.version, fromVersion) && 
           semver.lte(migration.version, toVersion);
  });
}
```

#### Step 2.3: Create Sample Migration
Create [`src/main/migrations/001_add_remark_column.js`](src/main/migrations/001_add_remark_column.js):
```javascript
export default {
  version: '1.0.1',
  description: 'Add remark column to sales table',
  
  up: async (db) => {
    return new Promise((resolve, reject) => {
      db.run("ALTER TABLE sales ADD COLUMN remark TEXT", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },
  
  down: async (db) => {
    // Rollback logic if possible
    return Promise.resolve();
  }
};
```

### Phase 3: UI Components (Week 3-4)

#### Step 3.1: Create Update Components Directory
```
src/components/Update/
├── UpdateNotification.jsx
├── UpdateProgress.jsx
├── UpdateController.jsx
└── UpdateSection.jsx
```

#### Step 3.2: Implement Update Notification
Create [`src/components/Update/UpdateNotification.jsx`](src/components/Update/UpdateNotification.jsx):
```jsx
import React, { useState, useEffect } from 'react';

const UpdateNotification = ({ onUpdateStart }) => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await window.api.updateApi.checkForUpdates();
        if (update.available) {
          setUpdateInfo(update);
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Update check failed:', error);
      }
    };

    checkForUpdates();
  }, []);

  if (!isVisible || !updateInfo) return null;

  return (
    <div className="update-notification">
      <h3>อัปเดตใหม่พร้อมใช้งาน</h3>
      <p>เวอร์ชัน {updateInfo.latestVersion}</p>
      <button onClick={() => onUpdateStart(updateInfo)}>
        อัปเดตเลย
      </button>
      <button onClick={() => setIsVisible(false)}>
        ภายหลัง
      </button>
    </div>
  );
};

export default UpdateNotification;
```

#### Step 3.3: Integrate with App.jsx
Modify [`src/App.jsx`](src/App.jsx):
```jsx
import UpdateController from './components/Update/UpdateController';

function App() {
  // Existing code...

  return (
    <div className="app-root-layout">
      <Navigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      <div className="app-content">
        {renderScreen()}
      </div>
      <UpdateController /> {/* NEW */}
    </div>
  );
}
```

### Phase 4: Configuration and Security (Week 4-5)

#### Step 4.1: Environment Configuration
Create [`.env.example`](.env.example):
```
GITHUB_OWNER=your-username
GITHUB_REPO=puenkaset
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
NODE_ENV=production
```

#### Step 4.2: Update Package.json
Modify [`package.json`](package.json):
```json
{
  "dependencies": {
    "semver": "^7.5.4",
    "node-fetch": "^3.3.2",
    "yauzl": "^2.10.0"
  },
  "build": {
    "files": [
      "src/main/services/**/*",
      "src/main/migrations/**/*",
      "src/main/config/**/*"
    ],
    "asarUnpack": [
      "src/main/migrations/**/*"
    ],
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "puenkaset",
      "private": true
    }
  }
}
```

### Phase 5: GitHub Actions Setup (Week 5-6)

#### Step 5.1: Create Release Workflow
Create [`.github/workflows/release.yml`](.github/workflows/release.yml):
```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Build Electron app
      run: npm run dist
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: dist/*.exe
        draft: false
        prerelease: false
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Testing Strategy

### Unit Tests
```javascript
// tests/update.test.js
import { UpdateManager } from '../src/main/services/UpdateManager.js';

describe('UpdateManager', () => {
  test('should detect available updates', async () => {
    const updateManager = new UpdateManager();
    const result = await updateManager.checkForUpdates();
    expect(result).toHaveProperty('available');
  });
});
```

### Integration Tests
```javascript
// tests/integration/github.test.js
import { GitHubService } from '../src/main/services/GitHubService.js';

describe('GitHub Integration', () => {
  test('should fetch latest release', async () => {
    const github = new GitHubService();
    const release = await github.getLatestRelease();
    expect(release).toHaveProperty('tag_name');
  });
});
```

## Deployment Checklist

### Pre-deployment
- [ ] Set up GitHub Personal Access Token
- [ ] Configure repository secrets
- [ ] Test update detection in development
- [ ] Verify database migration scripts
- [ ] Test error handling scenarios

### Deployment
- [ ] Create initial release tag (v1.0.0)
- [ ] Verify GitHub Actions workflow
- [ ] Test update process end-to-end
- [ ] Monitor update success rates
- [ ] Set up error logging

### Post-deployment
- [ ] Monitor update adoption
- [ ] Track error rates
- [ ] Collect user feedback
- [ ] Plan next release cycle

## Troubleshooting

### Common Issues

#### Authentication Errors
```javascript
// Check token validity
const isValid = await securityManager.validateGitHubToken(token);
if (!isValid) {
  console.error('Invalid GitHub token');
}
```

#### Download Failures
```javascript
// Implement retry logic
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
  try {
    await downloadManager.downloadFile(url, destination);
    break;
  } catch (error) {
    if (i === maxRetries - 1) throw error;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
```

#### Migration Errors
```javascript
// Always backup before migration
try {
  await databaseMigrator.createBackup();
  await databaseMigrator.migrate(fromVersion, toVersion);
} catch (error) {
  await databaseMigrator.restoreFromBackup();
  throw error;
}
```

## Security Best Practices

1. **Token Security**: Store GitHub tokens securely using Electron's safeStorage
2. **Download Verification**: Always verify download integrity with checksums
3. **Backup Strategy**: Create backups before any destructive operations
4. **Error Handling**: Implement comprehensive rollback mechanisms
5. **Logging**: Log all update activities for debugging

## Performance Considerations

1. **Background Updates**: Check for updates in background to avoid blocking UI
2. **Progress Feedback**: Provide real-time progress updates to users
3. **Bandwidth Management**: Implement download resumption for large files
4. **Database Optimization**: Batch database operations during migration

## Monitoring and Analytics

1. **Update Success Rate**: Track successful vs failed updates
2. **Download Performance**: Monitor download speeds and completion rates
3. **Error Tracking**: Log and analyze update errors
4. **User Adoption**: Track update adoption rates

This implementation guide provides a structured approach to building the updater system. Follow the phases sequentially, test thoroughly at each step, and refer to the comprehensive architecture document for detailed specifications.