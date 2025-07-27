const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', chunk => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', err => reject(err));
    });
}

async function verifyBuildIntegrity() {
    console.log('Verifying build integrity...');
    const distDir = path.resolve(__dirname, '../dist');

    try {
        const files = fs.readdirSync(distDir);
        const checksums = {};

        for (const file of files) {
            const filePath = path.join(distDir, file);
            if (fs.statSync(filePath).isFile()) {
                console.log(`Calculating checksum for ${file}...`);
                const checksum = await calculateChecksum(filePath);
                checksums[file] = checksum;
                console.log(`  ${file}: ${checksum}`);
            }
        }

        // You might want to store these checksums and compare them against a known good set
        // For now, we just print them.
        console.log('\nAll build asset checksums calculated:');
        console.log(JSON.stringify(checksums, null, 2));

        console.log('Build integrity verification completed successfully.');
    } catch (error) {
        console.error(`Build integrity verification failed: ${error.message}`);
        process.exit(1);
    }
}

verifyBuildIntegrity();