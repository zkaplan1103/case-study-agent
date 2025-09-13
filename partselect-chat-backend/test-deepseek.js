// Quick test script for DeepSeek integration
import { DeepSeekService } from './src/services/DeepSeekService.js';

async function testDeepSeek() {
  console.log('🧪 Testing DeepSeek Integration...\n');
  
  const deepSeek = new DeepSeekService();
  
  // Test 1: Health check
  console.log('1. Health Check:');
  const health = await deepSeek.healthCheck();
  console.log(JSON.stringify(health, null, 2));
  console.log('');
  
  // Test 2: Usage stats
  console.log('2. Usage Stats:');
  const stats = await deepSeek.getUsageStats();
  console.log(JSON.stringify(stats, null, 2));
  console.log('');
  
  // Test 3: Simple completion
  console.log('3. Simple Completion Test:');
  const testPrompt = 'How can I install part number PS11752778?';
  const response = await deepSeek.generateCompletion(testPrompt, { maxTokens: 50 });
  console.log(`Prompt: ${testPrompt}`);
  console.log(`Response: ${response}`);
  console.log('');
  
  // Test 4: Full integration test
  console.log('4. Full Integration Test (Instalily Cases):');
  const integrationTest = await deepSeek.testIntegration();
  console.log('Summary:', JSON.stringify(integrationTest.summary, null, 2));
  
  integrationTest.results.forEach((result, index) => {
    console.log(`\nTest ${index + 1}:`);
    console.log(`Query: ${result.query}`);
    console.log(`Response: ${result.response.substring(0, 100)}...`);
    console.log(`Time: ${result.responseTime}ms`);
  });
  
  console.log('\n✅ DeepSeek integration test completed!');
}

testDeepSeek().catch(console.error);