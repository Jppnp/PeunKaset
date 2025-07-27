const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const releaseNotesPath = path.resolve(__dirname, '../RELEASE_NOTES.md');

function generateReleaseNotes() {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const currentVersion = packageJson.version;

        let notes = `# Puenkaset POS v${currentVersion} Release Notes\n\n`;
        notes += `## Date: ${new Date().toISOString().split('T')[0]}\n\n`;
        notes += `### Changes in this version:\n\n`;

        // Attempt to get recent commit messages
        try {
            const lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
            const commitMessages = execSync(`git log ${lastTag}..HEAD --oneline --no-merges`, { encoding: 'utf8' }).trim();
            if (commitMessages) {
                notes += '```\n' + commitMessages + '\n```\n\n';
            } else {
                notes += '- No specific commit messages found since last tag.\n\n';
            }
        } catch (gitError) {
            notes += `- Could not retrieve commit messages (no previous tags or git not available).\n
        (${gitError.message})\n`;
        }

        notes += `## How to Update:\n\n`;
        notes += `1. Download the latest installer from the GitHub Releases page.\n`;
        notes += `2. Run the installer to update your application.\n\n`;
        notes += `## Important Notes:\n\n`;
        notes += `- Please back up your database before updating.\n`;
        notes += `- If you encounter any issues, please report them on GitHub.\n`;

        fs.writeFileSync(releaseNotesPath, notes);
        console.log(`Release notes generated at ${releaseNotesPath}`);
    } catch (error) {
        console.error(`Failed to generate release notes: ${error.message}`);
        process.exit(1);
    }
}

generateReleaseNotes();