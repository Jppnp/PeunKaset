import{ execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const packageJsonPath = path.resolve(__dirname, '../package.json');

function getPackageVersion() {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
}

async function publishRelease(bumpType) {
    try {
        console.log('Starting release preparation...');

        // 1. Run pre-release validation
        console.log('Running pre-release validation...');
        execSync('node scripts/pre-release-validation.js', { stdio: 'inherit' });

        // 2. Bump version
        console.log(`Bumping version (${bumpType})...`);
        execSync(`node scripts/version-bump.js ${bumpType}`, { stdio: 'inherit' });
        const newVersion = getPackageVersion();
        console.log(`New version: v${newVersion}`);

        // 3. Generate release notes
        console.log('Generating release notes...');
        execSync('node scripts/generate-release-notes.js', { stdio: 'inherit' });

        // 4. Commit changes and tag
        console.log('Committing changes and creating tag...');
        execSync('git add package.json RELEASE_NOTES.md', { stdio: 'inherit' });
        execSync(`git commit -m "Release v${newVersion}"`, { stdio: 'inherit' });
        execSync(`git tag v${newVersion}`, { stdio: 'inherit' });

        // 5. Push to GitHub (this will trigger the GitHub Actions workflow)
        console.log('Pushing to GitHub...');
        execSync('git push origin main', { stdio: 'inherit' });
        execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });

        console.log(`Successfully initiated release v${newVersion}. GitHub Actions will now build and publish.`);
    } catch (error) {
        console.error(`Release process failed: ${error.message}`);
        process.exit(1);
    }
}

const bumpType = process.argv[2];
if (!bumpType || !['patch', 'minor', 'major'].includes(bumpType)) {
    console.error('Usage: node scripts/publish-release.js [patch|minor|major]');
    process.exit(1);
}

publishRelease(bumpType);