# Puenkaset POS Application Patcher System: Quick Reference Guides

This document provides concise checklists and quick references for common tasks related to the Puenkaset POS application's update system.

## 1. Setup Checklist for New Installations (Developer)

A quick checklist for setting up the development environment for the update system.

*   [ ] **Install Prerequisites:** Node.js (v18+), Git.
*   [ ] **Clone Repository:** `git clone https://github.com/your-github-username/puenkaset.git`
*   [ ] **Install Dependencies:** `cd puenkaset && npm install`
*   [ ] **Configure `.env`:**
    *   [ ] Copy `.env.example` to `.env`.
    *   [ ] Set `GITHUB_OWNER` to the correct GitHub username/organization.
    *   [ ] Set `GITHUB_REPO` to `puenkaset`.
    *   [ ] Set `GITHUB_TOKEN` with a valid GitHub Personal Access Token (PAT) with appropriate permissions (e.g., `repo` scope for private repos, `public_repo` for public).
*   [ ] **Verify GitHub PAT:** (Optional) Use in-app settings to validate the token.

## 2. Release Process Quick Reference (Developer/Maintainer)

A condensed guide for creating and publishing new application releases.

*   [ ] **Update `main` branch:** `git checkout main && git pull origin main`
*   [ ] **Run Pre-release Validation:** `npm run lint` and `node scripts/pre-release-validation.js`
*   [ ] **Initiate Release:** `node scripts/publish-release.js [patch|minor|major]`
    *   Choose `patch` for bug fixes, `minor` for new features, `major` for breaking changes.
*   [ ] **Monitor GitHub Actions:** Check "Actions" tab on GitHub for "Release Puenkaset POS" workflow.
*   [ ] **Verify GitHub Release:** Confirm new release and assets on "Releases" tab.

## 3. Troubleshooting Quick Reference (User & Developer)

Common issues and their immediate solutions.

### For Users:

*   **"Update Failed" / No Update Notification:**
    *   [ ] Check internet connection.
    *   [ ] Ensure sufficient disk space.
    *   [ ] Try manual update check in `Settings` > `Application Update`.
    *   [ ] Temporarily disable antivirus (if suspected).
    *   [ ] Restart application/computer.
    *   [ ] Contact support with error messages and `update.log`.
*   **Application Not Starting After Update:**
    *   [ ] Restart computer.
    *   [ ] Reinstall application from official source (data should be safe).

### For Developers/Maintainers:

*   **GitHub API Rate Limit Exceeded:**
    *   [ ] Ensure `GITHUB_TOKEN` is set and valid (authenticated requests have higher limits).
    *   [ ] Wait for rate limit reset.
*   **GitHub Actions Workflow Failure:**
    *   [ ] Review GitHub Actions workflow logs for specific errors.
    *   [ ] Check dependency installation, build errors, and `GITHUB_TOKEN` permissions.
*   **Missing/Incorrect Release Assets:**
    *   [ ] Verify `electron-builder` configuration in `package.json`.
    *   [ ] Check `files` array in GitHub Actions workflow (`release.yml`).
*   **Database Migration Failures:**
    *   [ ] Check application logs (`update.log`) for migration errors.
    *   [ ] Restore database from latest backup.
    *   [ ] Inspect migration script (`up` method) for errors.

## 4. Emergency Procedures Quick Reference

Concise steps for critical situations.

### 4.1 Database Recovery (from Backup)

*   [ ] **Close Puenkaset POS application.**
*   [ ] **Locate Backup:** Find the desired `data.db.backup.YYYY-MM-DDTHH-MM-SS-sss` file.
*   [ ] **Verify Backup:** (Optional but recommended) Check integrity of backup file.
*   [ ] **Rename Current DB:** Rename `data.db` to `data.db.corrupted`.
*   [ ] **Copy & Rename Backup:** Copy the backup file and rename it to `data.db`.
*   [ ] **Restart Puenkaset POS.**

### 4.2 Emergency Release Rollback (Developer/Maintainer - Use with Extreme Caution)

*   [ ] **Identify Version:** Note the exact problematic version (e.g., `1.0.1`).
*   [ ] **Execute Rollback Script:** `node scripts/rollback-release.js [version_to_rollback]`
*   [ ] **CRITICAL MANUAL STEP:** Go to GitHub Releases page and **manually delete** the problematic release and its assets.

## 5. Production Deployment Checklist

A checklist to ensure a smooth and secure production deployment.

*   [ ] **Environment Variables:**
    *   [ ] `GITHUB_OWNER` and `GITHUB_REPO` are correctly set.
    *   [ ] `GITHUB_TOKEN` is a valid, active, and fine-grained PAT with minimal necessary permissions.
    *   [ ] `.env` file is secured and not committed to version control.
*   [ ] **Application Configuration (`update.config.js`):**
    *   [ ] `autoCheck`, `autoDownload`, `autoInstall` are configured as desired for production (e.g., `autoInstall: false` for manual control).
    *   [ ] `allowPrerelease: false` (unless specifically intended for a production pre-release channel).
    *   [ ] `backupBeforeUpdate: true` and `maxBackups` are set appropriately.
    *   [ ] `logging.level` is set to `info` or `warn` for production.
*   [ ] **Database:**
    *   [ ] Database backup strategy is in place and tested.
    *   [ ] Initial database schema is correct for the deployed application version.
*   [ ] **Security:**
    *   [ ] GitHub PATs are regularly reviewed and rotated.
    *   [ ] Secure token storage is verified.
    *   [ ] File integrity verification is implemented for updates.
    *   [ ] All dependencies are up-to-date and free from known vulnerabilities.
*   [ ] **Testing:**
    *   [ ] Manual testing procedures (as documented in Developer Guide) have been performed on a staging environment.
    *   [ ] Update process (download, install, restart) has been verified.
    *   [ ] Rollback procedure has been tested in a controlled environment.