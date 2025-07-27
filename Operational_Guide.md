# Puenkaset POS Application Patcher System: Operational Guide

This guide provides essential information for operating, monitoring, and maintaining the Puenkaset POS application's update system. It also covers backup, recovery, and emergency procedures.

## 1. Monitoring and Maintenance Procedures

Regular monitoring and maintenance are crucial for ensuring the update system operates smoothly and reliably.

### 1.1 Application Logging

The update system generates logs that are vital for diagnosing issues and monitoring activity.

*   **Log File Location:** The main update log file is typically located at:
    `C:\Users\YourUser\AppData\Roaming\PuenkasetPOS\logs\update.log` (Windows)
    `~/Library/Application Support/PuenkasetPOS/logs/update.log` (macOS)
    `~/.config/PuenkasetPOS/logs/update.log` (Linux)
    *Replace `YourUser` with the actual user's profile name.*
*   **Configuring Log Level:** The logging level can be configured in `src/main/config/update.config.js`:
    ```javascript
    logging: {
      level: 'info', // Options: 'info', 'warn', 'error', 'debug'
      filePath: 'update.log'
    }
    ```
    *   `info`: General information about update checks, downloads, and installations.
    *   `warn`: Potential issues that are not critical errors.
    *   `error`: Critical errors that prevent updates.
    *   `debug`: Detailed information for troubleshooting (use only when actively debugging).
*   **What to Look For:**
    *   Any entries with `error` or `warn` level.
    *   Successful update completion messages.
    *   Messages indicating failed downloads or installations.

### 1.2 Database Health Checks

Regularly verify the integrity of the application's SQLite database.

*   **In-Application Check:** Use the "ตรวจสอบฐานข้อมูล" (Check Database) button in the `Settings` > `Application Update` section. This runs an integrity check.
*   **Underlying Mechanism:** The application uses `DatabaseMigrator.js`'s `validateDatabaseIntegrity()` method, which executes `PRAGMA integrity_check` on the SQLite database.
*   **Action on Failure:** If the database integrity check fails, immediately perform a database restore from the latest valid backup.

### 1.3 Backup Management

Manage the automatic database backups created by the update system.

*   **Automatic Cleanup:** The system is configured to keep a maximum number of backups (`maxBackups` in `update.config.js`). Old backups are automatically removed.
    ```javascript
    backupBeforeUpdate: true, // Create a database backup before starting update
    maxBackups: 5, // Maximum number of database backups to keep
    ```
*   **Manual Cleanup:** You can manually delete older backup files from the database directory if needed. Backup files are named like `your_database_name.backup.YYYY-MM-DDTHH-MM-SS-sss`.

### 1.4 GitHub API Usage Monitoring

The update system interacts with the GitHub API. Be aware of rate limits, especially in environments with many installations or frequent checks.

*   **Monitoring Rate Limits:** The `GitHubService.js` includes methods like `checkRateLimit()` to retrieve current rate limit status (remaining requests, limit, reset time).
*   **In-Application Check:** The "ทดสอบการเชื่อมต่อ GitHub" (Test GitHub Connection) button in `Settings` > `Application Update` provides current rate limit information.
*   **Action on Exceeding Limits:** If rate limits are frequently hit, ensure a valid GitHub Personal Access Token (PAT) is configured, as authenticated requests have much higher limits.

## 2. Backup and Recovery Procedures

Robust backup and recovery procedures are essential for data integrity and business continuity.

### 2.1 Automatic Backups

*   The application automatically creates a backup of the database before initiating any update process, as configured by `backupBeforeUpdate: true` in `update.config.js`.
*   These backups are stored alongside the main database file.

### 2.2 Manual Database Backup

It is highly recommended to perform manual database backups periodically, especially before any major system changes or updates.

1.  **Using the Application:** Click the "สำรองฐานข้อมูล" (Backup Database) button in the `Settings` > `Application Update` section. The application will create a timestamped backup file.
2.  **Locating Backup Files:** Backup files are stored in the same directory as your main database file (e.g., `data.db`). They will have a `.backup.YYYY-MM-DDTHH-MM-SS-sss` suffix.

### 2.3 Restoring from Backup

In case of database corruption or data loss, you can restore from a previous backup.

1.  **Identify the Backup:** Locate the desired backup file (e.g., `data.db.backup.2025-07-26T10-30-00-123`).
2.  **Verify Backup Integrity:** Before restoring, it's crucial to verify the backup file is not corrupted.
    *   The `DatabaseMigrator.js`'s `verifyBackup()` method can be used programmatically.
    *   You can also try opening the backup file with a SQLite browser to ensure it's readable.
3.  **Restore Process:**
    *   **Close the Puenkaset POS application.**
    *   Navigate to the directory containing your main database file (`data.db`) and the backup files.
    *   **Rename or move the current `data.db` file** (e.g., to `data.db.corrupted`) to preserve it in case the restore fails.
    *   **Copy the chosen backup file** and rename it to `data.db`.
    *   **Example (Windows Command Prompt):**
        ```cmd
        cd "C:\Users\YourUser\AppData\Roaming\PuenkasetPOS"
        ren data.db data.db.corrupted
        copy data.db.backup.2025-07-26T10-30-00-123 data.db
        ```
    *   **Restart the Puenkaset POS application.** Verify that your data has been restored correctly.

## 3. Emergency Rollback Procedures

Rollbacks should be considered a last resort for critical issues that cannot be immediately fixed with a new patch. They involve reverting the application to a previous version.

### 3.1 When to Perform a Rollback

*   Only in cases of critical, widespread application failure immediately after an update.
*   When a newly released version introduces severe bugs that impact core functionality and cannot wait for a hotfix.

### 3.2 Step-by-Step Rollback Guide

This procedure involves Git operations and **requires manual cleanup on GitHub**.

1.  **Identify the Problematic Version:** Note the exact version number of the release you need to roll back (e.g., `1.0.1`).
2.  **Execute the Rollback Script:**
    *   On a development machine with the repository cloned, navigate to the project root.
    *   Run the `rollback-release.js` script, providing the version to roll back:
        ```bash
        node scripts/rollback-release.js 1.0.1
        ```
    *   This script will:
        *   Delete the local Git tag associated with the version.
        *   Delete the remote Git tag from your GitHub repository.
        *   Revert the last commit on the `main` branch (assuming it was the release commit).
        *   Push the reverted `main` branch to `origin`.
3.  **Critical Manual Cleanup on GitHub:**
    *   **The `rollback-release.js` script CANNOT delete the GitHub Release itself or its associated assets.**
    *   You **MUST** manually go to your GitHub repository's "Releases" tab.
    *   Find the problematic release (e.g., `v1.0.1`) and **delete it completely**, including all attached assets.
    *   Failure to do this will result in users still being able to download the problematic version from GitHub.

### 3.3 Important Considerations for Rollbacks

*   **Data Loss:** Rollbacks of application code do not automatically revert database changes. If the problematic release included database migrations, you might need to manually revert the database using a backup or a `down` migration (if available and safe).
*   **Git History:** Rollbacks rewrite Git history. This can cause issues for other developers who have pulled the problematic release. Communicate clearly with your team.
*   **Prefer Patch Fixes:** In most cases, it is safer and less disruptive to release a new patch version with a fix rather than performing a full rollback, especially if users have already started downloading the problematic version.

## 4. Performance Optimization Guidelines

Optimizing update performance ensures a smoother experience for users.

*   **4.1 Tuning Download Settings:**
    *   The `download` section in `src/main/config/update.config.js` contains configurable parameters:
        ```javascript
        download: {
          timeout: 60000, // Download timeout in ms (60 seconds)
          retries: 5, // Number of retries for downloads
          retryDelay: 5000, // Delay between retries in ms (5 seconds)
          chunkSize: 1024 * 1024 // Download chunk size (1MB)
        }
        ```
    *   Adjust `timeout` and `retries` based on network reliability in your deployment environment.
    *   `chunkSize` can be adjusted, but 1MB is generally a good balance. Larger chunks might be faster on stable networks but less resilient to interruptions.
*   **4.2 GitHub API Request Timeouts:**
    *   The `github` section in `src/main/config/update.config.js` includes a `timeout` for API requests:
        ```javascript
        github: {
          // ...
          timeout: 30000, // API request timeout in ms (30 seconds)
          retries: 3 // Number of retries for API requests
        }
        ```
    *   Increase these values if you experience frequent API timeouts, especially in regions with higher latency to GitHub.

## 5. Security Audit Checklist

Regular security audits are vital for maintaining the integrity and security of the update system.

*   **5.1 GitHub Personal Access Token (PAT) Review:**
    *   Regularly review all PATs used for the update system on GitHub.
    *   Ensure they have the minimum necessary permissions (Principle of Least Privilege).
    *   Verify expiration dates and rotate tokens periodically.
    *   Delete any unused or compromised tokens immediately.
*   **5.2 Secure Token Storage:**
    *   Verify that the application's secure token storage mechanism (`SecurityManager.js`) is functioning correctly on deployed machines.
    *   Ensure that the `secure-tokens.dat` file (where tokens are stored) is protected by appropriate file system permissions.
*   **5.3 File Integrity Verification:**
    *   The `SecurityManager.js` includes `calculateFileHash()` and `verifyFileIntegrity()` methods.
    *   Implement procedures to verify the integrity of downloaded update packages before installation using checksums provided in the GitHub Release. This prevents installation of tampered or corrupted files.
*   **5.4 Code Scanning and Linting:**
    *   Integrate static code analysis tools (like ESLint, as used in `pre-release-validation.js`) into your CI/CD pipeline.
    *   Regularly run these tools to identify potential security vulnerabilities or code quality issues.
*   **5.5 Dependency Security Updates:**
    *   Regularly update all project dependencies (`npm update`) to ensure you are using versions free from known security vulnerabilities.
    *   Use tools like `npm audit` to check for vulnerabilities in your dependencies.
*   **5.6 Sensitive Configuration Protection:**
    *   Ensure the `.env` file and any other sensitive configuration files are not committed to version control.
    *   Restrict access to these files on production servers.
    *   Use environment variables or secure secrets management systems for production deployments.
