const { execSync } = require('child_process');


function rollbackRelease(versionToRollback) {
    try {
        console.log(`Attempting to roll back release v${versionToRollback}...`);

        // 1. Delete local tag
        console.log(`Deleting local tag v${versionToRollback}...`);
        execSync(`git tag -d v${versionToRollback}`, { stdio: 'inherit' });

        // 2. Delete remote tag
        console.log(`Deleting remote tag v${versionToRollback}...`);
        execSync(`git push origin :refs/tags/v${versionToRollback}`, { stdio: 'inherit' });

        // 3. Revert the last commit (assuming it's the release commit)
        console.log('Reverting the last commit (assuming it was the release commit)...');
        execSync('git revert HEAD --no-edit', { stdio: 'inherit' });
        execSync('git push origin main', { stdio: 'inherit' });

        console.log(`Successfully rolled back release v${versionToRollback}.`);
        console.log('Please manually clean up any GitHub Release assets if they were created.');
    } catch (error) {
        console.error(`Rollback failed: ${error.message}`);
        console.error('Manual intervention may be required.');
        process.exit(1);
    }
}

const version = process.argv[2];
if (!version) {
    console.error('Usage: node scripts/rollback-release.js [version_to_rollback]');
    console.error('Example: node scripts/rollback-release.js 1.0.1');
    process.exit(1);
}

rollbackRelease(version);