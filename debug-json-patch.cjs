const JSONPatchService = require('./backend/src/services/json-patch-service');

console.log('🧪 Testing JSONPatchService patch generation...');

async function testPatchGeneration() {
  const patchService = new JSONPatchService();
  
  // Test case 1: Simple add function request
  const testPrompt1 = "Add a new function called fetchUserData that takes a userId parameter";
  const testSourceCode1 = `import React from 'react';

const MyComponent = () => {
  return <div>Hello World</div>;
};

export default MyComponent;`;

  console.log('\n1. Testing simple function addition...');
  console.log('   Prompt:', testPrompt1);
  console.log('   Source code length:', testSourceCode1.length);
  
  try {
    const result1 = await patchService.generatePatch({
      prompt: testPrompt1,
      ast: null, // Simulating missing AST (this might be the issue)
      sourceCode: testSourceCode1,
      filePath: 'test.jsx',
      context: {}
    });
    
    console.log('   ✅ Result:', result1.success ? 'SUCCESS' : 'FAILED');
    if (!result1.success) {
      console.log('   ❌ Error:', result1.error);
    } else {
      console.log('   📋 Operations:', result1.operations?.length || 0);
      console.log('   📋 Patch length:', result1.patch?.length || 0);
      console.log('   📋 Confidence:', result1.confidence);
    }
  } catch (error) {
    console.log('   ❌ Exception:', error.message);
    console.log('   📍 Stack:', error.stack?.split('\n')[0]);
  }

  // Test case 2: Test with empty/null AST (likely the real issue)
  console.log('\n2. Testing with various AST states...');
  
  const astTestCases = [
    { name: 'null AST', ast: null },
    { name: 'empty AST', ast: {} },
    { name: 'minimal AST', ast: { type: 'Program', body: [] } }
  ];
  
  for (const testCase of astTestCases) {
    console.log(`   Testing ${testCase.name}...`);
    try {
      const result = await patchService.generatePatch({
        prompt: testPrompt1,
        ast: testCase.ast,
        sourceCode: testSourceCode1,
        filePath: 'test.jsx',
        context: {}
      });
      
      console.log(`   ${testCase.name}: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!result.success) {
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ${testCase.name}: ❌ EXCEPTION - ${error.message}`);
    }
  }

  // Test case 3: Test intent analysis directly
  console.log('\n3. Testing intent analysis...');
  try {
    const intent = patchService._analyzePromptIntent(testPrompt1);
    console.log('   Intent action:', intent.action);
    console.log('   Intent target:', intent.target);
    console.log('   Intent confidence:', intent.confidence);
    console.log('   Intent details:', Object.keys(intent.details));
  } catch (error) {
    console.log('   ❌ Intent analysis failed:', error.message);
  }
}

testPatchGeneration().catch(error => {
  console.error('❌ Test failed:', error.message);
  console.error('📍 Stack:', error.stack);
});