// Test script to verify Anthropic API and available models
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testModels() {
  console.log('Testing Anthropic API...');
  console.log('API Key configured:', process.env.ANTHROPIC_API_KEY ? 'Yes (starts with: ' + process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...)' : 'No');

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-latest',
    'claude-3-opus-latest',
    'claude-3-sonnet-latest',
    'claude-3-haiku-latest'
  ];

  for (const model of modelsToTest) {
    try {
      console.log(`\nTesting model: ${model}`);
      const message = await client.messages.create({
        model: model,
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Hi'
        }]
      });
      console.log(`✅ SUCCESS - Model ${model} works!`);
      console.log(`   Response: ${message.content[0].text}`);
      console.log(`   Usage: ${JSON.stringify(message.usage)}`);
    } catch (error) {
      console.log(`❌ FAILED - Model ${model}`);
      console.log(`   Error: ${error.message}`);
      if (error.status) {
        console.log(`   Status: ${error.status}`);
      }
    }
  }
}

testModels().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
