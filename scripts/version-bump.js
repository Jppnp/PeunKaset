const fs = require('fs');
const path = require('path');
const semver = require('semver');

const packageJsonPath = path.resolve(__dirname, '../package.json');

function bumpVersion(type) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const currentVersion = packageJson.version;
        const newVersion = semver.inc(currentVersion, type);

        if (!newVersion) {
            console.error(`Error: Invalid bump type '${type}'. Must be 'patch', 'minor', or 'major'.`);
            process.exit(1);
        }

        packageJson.version = newVersion;
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

        console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
        return newVersion;
    } catch (error) {
        console.error(`Failed to bump version: ${error.message}`);
        process.exit(1);
    }
}

const bumpType = process.argv[2];
if (!bumpType) {
    console.error('Usage: node scripts/version-bump.js [patch|minor|major]');
    process.exit(1);
}

bumpVersion(bumpType);