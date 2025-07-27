import { execSync } from 'child_process'

function runValidation() {
    console.log('Running pre-release validation checks...');
    try {
        // Example: Run ESLint
        console.log('Running ESLint...');
        execSync('npm run lint', { stdio: 'inherit' });
        console.log('ESLint passed.');

        // Add more validation steps here, e.g., running tests
        // console.log('Running tests...');
        // execSync('npm test', { stdio: 'inherit' });
        // console.log('Tests passed.');

        console.log('Pre-release validation completed successfully.');
    } catch (error) {
        console.error(`Pre-release validation failed: ${error.message}`);
        process.exit(1);
    }
}

runValidation();