/**
 * Test script for the DataProcessingService
 * Run with: node test-dataprocessing.js
 */

const { spawn } = require('child_process');
const path = require('path');

async function runTest() {
  console.log('🧪 Testing DataProcessingService Integration...\n');

  const testScript = `
import { runDataProcessingExample } from './src/utils/DataProcessingExample';

async function test() {
  try {
    console.log('Starting DataProcessingService test...');
    await runDataProcessingExample();
    console.log('\\n✅ DataProcessingService test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ DataProcessingService test failed:', error);
    process.exit(1);
  }
}

test();
`;

  // Write temporary test file
  const fs = require('fs');
  const testFile = path.join(__dirname, 'temp-test.mjs');
  fs.writeFileSync(testFile, testScript);

  try {
    // Run the test with ts-node
    const child = spawn('npx', ['ts-node', '--esm', 'temp-test.mjs'], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      // Cleanup
      fs.unlinkSync(testFile);
      
      if (code === 0) {
        console.log('\n🎉 All tests passed!');
      } else {
        console.log('\n💥 Tests failed!');
      }
    });

  } catch (error) {
    console.error('Error running test:', error);
    // Cleanup
    fs.unlinkSync(testFile);
  }
}

runTest();