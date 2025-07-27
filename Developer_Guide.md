# Puenkaset POS Application Patcher System: Developer/Maintainer Guide

This guide provides comprehensive technical documentation for developers and maintainers of the Puenkaset POS application's update system. It covers setup, release management, database migration best practices, and troubleshooting.

## 1. Complete Setup Guide for the Update System

To set up the Puenkaset POS application for development and to work with the update system, follow these steps:

### 1.1 Prerequisites

Ensure you have the following installed on your development machine:

*   **Node.js:** Version 18 or higher.
*   **Git:** Version 2.x or higher.
*   **GitHub Account:** Required for accessing the repository and managing releases.

### 1.2 Repository Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-github-username/puenkaset.git
    cd puenkaset
    ```
    *Replace `your-github-username` with the actual GitHub organization or user where the repository is hosted.*

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

### 1.3 Environment Configuration (`.env`)

The update system relies on environment variables, particularly for GitHub integration. These are typically stored in a `.env` file in the project root.

1.  **Create `.env` file:** Copy the `.env.example` file to `.env`:
    ```bash
    cp .env.example .env
    ```

2.  **Configure Variables:** Open the newly created `.env` file and set the following variables:

    *   `GITHUB_OWNER`: The GitHub username or organization that owns the `puenkaset` repository.
        *   **Configuration Fix:** Ensure you replace `your-github-username` with the actual owner.
        *   Example: `GITHUB_OWNER=PuenkasetOrg`
    *   `GITHUB_REPO`: The name of the repository. For Puenkaset POS, this is typically `puenkaset`.
        *   Example: `GITHUB_REPO=puenkaset`
    *   `GITHUB_TOKEN`: Your GitHub Personal Access Token (PAT). This is crucial for the application to check for updates, especially from private repositories, and for release automation.
        *   **Configuration Fix:** Replace `ghp_xxxxxxxxxxxxxxxxxxxx` with your actual PAT.

    Your `.env` file should look similar to this:
    ```
    GITHUB_OWNER=PuenkasetOrg
    GITHUB_REPO=puenkaset
    GITHUB_TOKEN=ghp_your_actual_personal_access_token
    NODE_ENV=development
    ```

### 1.4 GitHub Personal Access Token (PAT) Management

A GitHub Personal Access Token (PAT) is required for the application to interact with the GitHub API for update checks and downloads.

1.  **Creating a GitHub PAT:**
    *   Go to GitHub.com.
    *   Navigate to `Settings` > `Developer settings` > `Personal access tokens`.
    *   Click `Generate new token` (or `Generate new token (classic)` for broader compatibility).
    *   **Security Improvement:** For fine-grained control, prefer "Fine-grained tokens" if your repository supports it.
    *   **Required Permissions (Scopes):**
        *   For public repositories, typically `public_repo` is sufficient.
        *   For private repositories, you will need the `repo` scope (or more granular `contents:read` if using fine-grained tokens).
        *   **Principle of Least Privilege:** Only grant the minimum necessary permissions. For update checking and downloading, read-only access to repository contents is usually enough.
    *   Give your token a descriptive name (e.g., "Puenkaset POS Updater").
    *   Set an expiration date for the token.
    *   Generate the token and **copy it immediately**. You will not be able to see it again.

2.  **Securely Storing the PAT:**
    *   The application uses `src/main/services/SecurityManager.js` to securely store the GitHub token. It prioritizes Electron's `safeStorage` (platform-native encryption) and falls back to custom AES-256-GCM encryption if `safeStorage` is unavailable.
    *   You can set and validate the GitHub token directly within the application's `Settings` > `Application Update` section. This is the recommended way to store the token for deployed applications, as it encrypts the token on the user's machine.
    *   For development, setting `GITHUB_TOKEN` in your `.env` file is convenient.

## 2. How to Create and Publish New Releases

The release workflow for Puenkaset POS is automated using a set of helper scripts and GitHub Actions.

### 2.1 Overview of the Release Workflow

The release process follows a structured flow:

```mermaid
graph TD
    A[Developer runs publish-release.js] --> B{Pre-release Validation};
    B --> C[Version Bump & Release Notes Generation];
    C --> D[Commit & Git Tag Creation];
    D --> E[Push to GitHub (main branch & tag)];
    E --> F{GitHub Actions Workflow Triggered};
    F --> G[Build Electron App];
    G --> H[Create GitHub Release];
    H --> I[Upload Artifacts to Release];
    I --> J[Users download from GitHub Releases];
```

### 2.2 Step-by-Step Release Guide

Follow these steps to create and publish a new release:

1.  **Ensure your local `main` branch is up-to-date:**
    ```bash
    git checkout main
    git pull origin main
    ```

2.  **Run pre-release validation:**
    It is highly recommended to run validation checks before initiating a release.
    ```bash
    npm run lint # Run ESLint for code quality
    node scripts/pre-release-validation.js # Executes configured pre-checks (e.g., more linting, tests)
    ```
    Address any issues reported by these checks before proceeding.

3.  **Initiate the release process:**
    Choose the appropriate version bump type: `patch`, `minor`, or `major`, based on Semantic Versioning (SemVer) principles.

    *   `patch`: For backward-compatible bug fixes and minor improvements (e.g., `1.0.0` -> `1.0.1`).
    *   `minor`: For new features that are backward-compatible (e.g., `1.0.0` -> `1.1.0`).
    *   `major`: For breaking changes or significant new versions (e.g., `1.0.0` -> `2.0.0`).

    Run the `publish-release.js` script with your chosen bump type:
    ```bash
    node scripts/publish-release.js [patch|minor|major]
    # Example for a patch release:
    node scripts/publish-release.js patch
    ```
    This script will perform the following automated actions:
    *   Execute `scripts/pre-release-validation.js`.
    *   Update the `version` in `package.json` according to the bump type.
    *   Generate `RELEASE_NOTES.md` based on recent commit messages.
    *   Commit the updated `package.json` and `RELEASE_NOTES.md`.
    *   Create a Git tag (e.g., `v1.0.1`) corresponding to the new version.
    *   Push the commit and the new tag to the `origin/main` branch on GitHub.

4.  **Monitor the GitHub Actions workflow:**
    *   After pushing the tag, a GitHub Actions workflow (typically named `release.yml`) will be triggered.
    *   Go to your GitHub repository's "Actions" tab.
    *   Find the "Release Puenkaset POS" workflow run associated with your new tag.
    *   Monitor its progress and ensure it completes successfully. If it fails, review the logs to identify and fix the issue.

5.  **Verify the GitHub Release:**
    *   Once the GitHub Actions workflow is complete, navigate to your GitHub repository's "Releases" tab.
    *   Confirm that a new release with the correct version number and the generated release notes exists.
    *   Verify that all expected application artifacts (e.g., `.exe` installer for Windows, `.dmg` for macOS, `.AppImage` for Linux, along with `.yml` and `.blockmap` files) are correctly attached to the release.

### 2.3 Database Migration Best Practices

The Puenkaset POS application uses SQLite and a migration system to manage database schema changes.

*   **2.3.1 Understanding the Migrator:**
    *   `src/main/services/DatabaseMigrator.js` is responsible for applying and rolling back database schema changes.
    *   `src/main/migrations/index.js` acts as an index, listing all available migration scripts.
    *   Each migration script (e.g., `001_add_remark_column.js`) contains specific instructions for schema modifications.
*   **2.3.2 Creating New Migration Scripts:**
    *   When a database schema change is required (e.g., adding a new table, modifying a column), create a new migration file in `src/main/migrations/`.
    *   **Naming Convention:** Use a sequential number prefix (e.g., `003_add_new_table.js`) to ensure correct order.
    *   **Structure of a Migration File:** Each migration file must export an object with:
        *   `version`: A semantic version string (e.g., `1.0.1`, `1.1.0`). This version should correspond to the application version where this migration is introduced.
        *   `description`: A brief description of the migration's purpose.
        *   `up(db)`: An asynchronous function that contains the SQL statements to apply the schema change. This is executed when upgrading the database.
        *   `down(db)`: An asynchronous function that contains the SQL statements to revert the schema change. This is crucial for rollback procedures.
    *   **Example (`src/main/migrations/001_add_remark_column.js`):**
        ```javascript
        // Example structure
        import { runAsync } from '../utils/db-utils'; // Assuming a utility for async DB operations

        export default {
          version: '1.0.1',
          description: 'Add remark column to products table',
          async up(db) {
            await runAsync(db, `ALTER TABLE products ADD COLUMN remark TEXT`);
          },
          async down(db) {
            // Note: SQLite does not support dropping columns easily.
            // A common strategy is to recreate the table without the column,
            // copy data, and then drop the old table. This is complex and
            // should be handled with extreme care.
            // For simplicity, this example might not have a direct 'down' for column drops.
            // In production, consider a more robust migration tool or strategy.
            console.warn('Rollback for adding column might require manual intervention or full table recreation.');
          }
        };
        ```
    *   **Registering Migrations:** After creating a new migration file, ensure it is imported and added to the `migrations` array in `src/main/migrations/index.js`.
*   **2.3.3 Testing Migrations:**
    *   Always test new migrations thoroughly in a development environment.
    *   Test both the `up` and `down` methods to ensure they function as expected without data loss (if applicable).
    *   Test upgrading from a previous version to the version containing your new migration.
*   **2.3.4 Importance of Database Backups:**
    *   The update system is configured to create a database backup automatically before applying updates (`backupBeforeUpdate` in `update.config.js`).
    *   Always emphasize the importance of manual backups before any significant database operation or application update, especially in a production environment.

## 3. Troubleshooting Development and Deployment Issues

This section provides guidance on resolving common issues encountered during development and deployment of the update system.

### 3.1 GitHub API Rate Limit Exceeded

*   **Issue:** You might encounter `GitHub API rate limit exceeded` errors, especially during frequent testing or if many unauthenticated requests are made.
*   **Explanation:** GitHub imposes rate limits on API requests. Unauthenticated requests have a lower limit (e.g., 60 requests per hour) compared to authenticated requests (e.g., 5000 requests per hour).
*   **Solution:**
    *   **Use an Authenticated PAT:** Ensure your `GITHUB_TOKEN` is correctly set in your `.env` file or via the in-app settings. This significantly increases your rate limit.
    *   **Wait for Reset:** If you hit the limit, wait until the `x-ratelimit-reset` time (provided in API response headers) has passed. The `GitHubService.js` includes logic to `waitForRateLimit()` before making requests.
    *   **Optimize Requests:** Minimize unnecessary API calls during development.

### 3.2 GitHub Actions Workflow Failures

If your release workflow fails on GitHub Actions:

*   **Check Workflow Logs:** The most important step is to go to your GitHub repository, navigate to the "Actions" tab, click on the failed workflow run, and review the detailed logs. The logs will pinpoint the exact step that failed and provide error messages.
*   **Dependency Issues:** Ensure `npm install` completes successfully in the workflow. Sometimes, platform-specific dependencies or caching issues can cause problems.
*   **Build Errors:** If the `npm run dist` or `electron-builder` step fails, it indicates a problem with the Electron application's build configuration or your application code.
    *   **Local Test:** Try running `npm run dist` locally on your machine to replicate and debug the build error.
*   **GitHub Token Permissions:** Verify that the `GITHUB_TOKEN` used by your GitHub Actions workflow has the necessary permissions (e.g., `contents: write` for creating releases and uploading assets).

### 3.3 Missing or Incorrect Release Assets

*   **Issue:** After a successful GitHub Actions workflow, some expected application installers or files might be missing from the GitHub Release, or incorrect files are uploaded.
*   **Solution:**
    *   **Verify `electron-builder` Configuration:** Check the `build` section in your `package.json` for `files` array or `directories.output` settings. Ensure these paths correctly point to the generated build artifacts.
    *   **Check GitHub Actions Workflow:** Review the `release.yml` workflow file. Ensure the `files` array under the `upload-release-asset` step (or similar) correctly specifies the paths to the artifacts that `electron-builder` generates.

### 3.4 Database Migration Failures

*   **Issue:** The application fails to start or behaves unexpectedly after an update, and logs indicate a database migration error.
*   **Solution:**
    *   **Check Application Logs:** Review the `update.log` file (or console output during development) for specific error messages related to database migrations.
    *   **Restore from Backup:** If a backup was created before the update (which is the default behavior), you can restore the database to its previous state. Refer to the "Backup and Recovery Procedures" in the Operational Guide.
    *   **Inspect Migration Script:** If you developed the migration, carefully review the SQL statements in the failed migration script (`up` method) for syntax errors or logical flaws.
    *   **Manual Database Inspection:** Use a SQLite browser tool to inspect the database schema and data to understand the state after the failed migration.
    *   **Rollback (Development Only):** In a development environment, you might attempt to run the `down` method of the problematic migration, but this should be done with extreme caution and understanding of potential data loss.

## 4. Manual Testing Procedures

While automated tests are crucial, certain aspects of the update system benefit from manual verification. These procedures should be performed before a major release.

*   **4.1 Update Availability Notification:**
    *   Simulate a new release on GitHub.
    *   Launch the application and verify that the "New Update Available" notification appears correctly.
    *   Check that the version number and release notes are displayed accurately.
*   **4.2 Successful Download and Installation:**
    *   Initiate an update (either via notification or manually from settings).
    *   Monitor the download progress bar for accurate display of percentage, speed, and ETA.
    *   Observe the installation progress, ensuring all phases (backup, migrating, installing, cleanup) are shown.
    *   Verify the application restarts automatically upon successful completion.
    *   After restart, confirm the application is running the new version (check "About" or settings).
*   **4.3 Update Cancellation:**
    *   Start a download or installation.
    *   Attempt to cancel the update from the progress window.
    *   Verify that the process stops, the progress window closes, and the application returns to its previous state without errors.
*   **4.4 Update Failure Scenarios:**
    *   **Network Interruption:** Disconnect network during download/installation. Verify appropriate error messages are displayed and the process handles the interruption gracefully.
    *   **Insufficient Disk Space:** Attempt an update when disk space is low. Verify an error message related to disk space is shown.
    *   **Corrupted Download (Advanced):** If possible, manually corrupt a downloaded update file before installation. Verify the integrity check fails and an error is reported.
*   **4.5 Database Migration Verification:**
    *   Test an update that includes a database migration.
    *   After the update, verify that the new schema changes are applied correctly (e.g., new columns exist, data is migrated if applicable).
    *   Ensure existing data remains intact and accessible.
*   **4.6 Backup and Restore Verification:**
    *   Manually create a database backup.
    *   Verify the backup file is created and can be opened (e.g., with a SQLite browser).
    *   Simulate a database corruption or accidental deletion.
    *   Attempt to restore the database from the created backup and verify data integrity.
*   **4.7 Rollback Procedure (Test Environment Only):**
    *   In a dedicated test environment, perform a full release and then attempt to roll back using `scripts/rollback-release.js`.
    *   Verify that the Git history is reverted and the remote tag is deleted.
    *   **Crucially, manually verify that the GitHub Release and its assets are deleted from GitHub.com.**

This comprehensive testing ensures the robustness and reliability of the update system.