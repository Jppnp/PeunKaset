# Puenkaset POS Release Process Documentation

This document outlines the steps and best practices for releasing new versions of the Puenkaset POS application. The process is automated using GitHub Actions and a set of helper scripts.

## 1. Overview of the Release Workflow

The release workflow is designed to be simple yet robust:

1.  **Prepare Release**: A developer runs a local script (`publish-release.js`) to:
    *   Run pre-release validations (linting, etc.).
    *   Bump the application version in `package.json`.
    *   Generate release notes based on recent commits.
    *   Commit the version bump and release notes.
    *   Create a Git tag (e.g., `v1.0.1`).
    *   Push the commit and tag to the `main` branch on GitHub.
2.  **Automated Build & Release (GitHub Actions)**:
    *   The `push` of a new tag (e.g., `v*.*.*`) to the `main` branch triggers the `release.yml` GitHub Actions workflow.
    *   The workflow installs dependencies, builds the Electron application for various platforms (Windows, macOS, Linux).
    *   `electron-builder` automatically creates a GitHub Release for the pushed tag.
    *   The built application artifacts (executables, installers, checksums) are uploaded to the newly created GitHub Release.
3.  **Distribution**: Users can download the latest version directly from the GitHub Releases page.

## 2. Step-by-Step Release Guide

Follow these steps to create a new release:

1.  **Ensure your local `main` branch is up-to-date:**
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **Run pre-release validation (optional, but recommended):**
    ```bash
    npm run lint # Or any other local tests
    node scripts/pre-release-validation.js
    ```
    Address any issues reported before proceeding.
3.  **Initiate the release process:**
    Choose the appropriate bump type: `patch`, `minor`, or `major`.
    *   `patch`: For bug fixes and small improvements (e.g., `1.0.0` -> `1.0.1`)
    *   `minor`: For new features that are backward-compatible (e.g., `1.0.0` -> `1.1.0`)
    *   `major`: For breaking changes or significant new versions (e.g., `1.0.0` -> `2.0.0`)

    ```bash
    node scripts/publish-release.js [patch|minor|major]
    # Example for a patch release:
    # node scripts/publish-release.js patch
    ```
    This script will:
    *   Run `pre-release-validation.js`.
    *   Update the `version` in `package.json`.
    *   Generate `RELEASE_NOTES.md`.
    *   Commit `package.json` and `RELEASE_NOTES.md`.
    *   Create a Git tag (e.g., `v1.0.1`).
    *   Push the commit and tag to `origin/main`.

4.  **Monitor the GitHub Actions workflow:**
    *   Go to your GitHub repository -> "Actions" tab.
    *   Find the "Release Puenkaset POS" workflow triggered by your tag push.
    *   Ensure the workflow completes successfully. If it fails, review the logs to identify and fix the issue.

5.  **Verify the GitHub Release:**
    *   Once the workflow is complete, go to your GitHub repository -> "Releases" tab.
    *   Confirm that a new release with the correct version and generated release notes exists.
    *   Verify that all expected assets (e.g., `.exe`, `.dmg`, `.AppImage`, `.yml`, `.blockmap`) are attached to the release.

## 3. Version Management Best Practices

*   **Semantic Versioning (SemVer)**: Always follow SemVer (MAJOR.MINOR.PATCH).
    *   `MAJOR` version when you make incompatible API changes.
    *   `MINOR` version when you add functionality in a backward-compatible manner.
    *   `PATCH` version when you make backward-compatible bug fixes.
*   **Pre-releases**: For testing new features or major changes, consider using pre-release tags (e.g., `v1.1.0-beta.1`). The GitHub Actions workflow automatically marks releases with `-alpha`, `-beta`, or `-rc` in their tag as pre-releases.
*   **Commit Messages**: Write clear and concise commit messages. These can be used to help generate release notes.

## 4. Troubleshooting Common Issues

*   **GitHub Actions Workflow Failure**:
    *   **Check Logs**: The first step is always to review the workflow logs in GitHub Actions. They will pinpoint the exact step that failed and often provide error messages.
    *   **Dependency Issues**: Ensure `npm install` completes successfully. Sometimes, platform-specific dependencies can cause issues.
    *   **Build Errors**: If `npm run dist` fails, it's likely a problem with the Electron build configuration or your application code. Test locally using `npm run dist` before pushing.
    *   **GitHub Token**: Ensure the `GITHUB_TOKEN` secret is correctly configured and has the necessary permissions (usually `contents: write`).
*   **Release Assets Missing/Incorrect**:
    *   Verify the `files` array in `.github/workflows/release.yml` matches the output of your `electron-builder` configuration.
    *   Check `electron-builder` configuration in `package.json` for `directories.output` or `files` settings.

## 5. Emergency Rollback Procedures

If a critical issue is discovered immediately after a release, you can perform a rollback. **Use this with extreme caution, as it rewrites Git history and can cause issues for collaborators.**

1.  **Identify the problematic version:** Note the exact version number (e.g., `1.0.1`).
2.  **Run the rollback script:**
    ```bash
    node scripts/rollback-release.js [version_to_rollback]
    # Example:
    # node scripts/rollback-release.js 1.0.1
    ```
    This script will:
    *   Delete the local Git tag.
    *   Delete the remote Git tag.
    *   Revert the last commit on `main` (which should be the release commit).
    *   Push the reverted `main` branch to `origin`.

3.  **Manual Cleanup on GitHub:**
    *   **Crucially**, the rollback script **cannot delete the GitHub Release itself or its assets**. You must manually go to the GitHub Releases page for your repository and delete the problematic release.
    *   If you need to re-release a fixed version, you will need to create a new tag (e.g., `v1.0.2` or `v1.0.1-fix.1`) after applying fixes.

**Important Note on Rollbacks**: Rollbacks should be a last resort. It's generally safer to release a new patch version with a fix rather than reverting a release, especially if users have already started downloading it.