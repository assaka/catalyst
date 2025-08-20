const ASTAnalyzer = require('./backend/src/services/ast-analyzer');
const JSONPatchService = require('./backend/src/services/json-patch-service');
const ConflictDetector = require('./backend/src/services/conflict-detector');

console.log('🧪 Testing AI Context API endpoint logic...');

async function testEndpointLogic() {
  console.log('\n1. Testing service initialization...');
  
  try {
    const astAnalyzer = new ASTAnalyzer();
    console.log('   ✅ ASTAnalyzer initialized');
    
    const patchService = new JSONPatchService();
    console.log('   ✅ JSONPatchService initialized');
    
    const conflictDetector = new ConflictDetector();
    console.log('   ✅ ConflictDetector initialized');

    // Test case: Simulate the exact request from the frontend
    const testRequest = {
      prompt: "Add a new function called fetchUserData that takes a userId parameter",
      sourceCode: `import React from 'react';

const MyComponent = () => {
  return <div>Hello World</div>;
};

export default MyComponent;`,
      filePath: 'TestComponent.jsx',
      context: {
        timestamp: new Date().toISOString()
      }
    };

    console.log('\n2. Testing AST analysis step...');
    console.log('   Source code length:', testRequest.sourceCode.length);
    console.log('   File path:', testRequest.filePath);

    let astAnalysis;
    try {
      astAnalysis = await astAnalyzer.analyzeCode(testRequest.sourceCode, testRequest.filePath);
      console.log('   AST Analysis result:', astAnalysis.success ? '✅ SUCCESS' : '❌ FAILED');
      
      if (!astAnalysis.success) {
        console.log('   AST Error:', astAnalysis.error);
        return; // This might be the issue
      }
    } catch (astError) {
      console.log('   ❌ AST Analysis exception:', astError.message);
      return;
    }

    console.log('\n3. Testing patch generation step...');
    console.log('   Prompt:', testRequest.prompt);
    console.log('   AST available:', !!astAnalysis.ast);

    let patchResult;
    try {
      patchResult = await patchService.generatePatch({
        prompt: testRequest.prompt,
        ast: astAnalysis.ast,
        sourceCode: testRequest.sourceCode,
        filePath: testRequest.filePath,
        context: testRequest.context || {}
      });

      console.log('   Patch result:', patchResult.success ? '✅ SUCCESS' : '❌ FAILED');
      
      if (!patchResult.success) {
        console.log('   ❌ Patch Error:', patchResult.error);
        return; // This is likely where the failure occurs
      }
      
      console.log('   📋 Patch operations:', patchResult.patch?.length || 0);
      console.log('   📋 Confidence:', patchResult.confidence);

    } catch (patchError) {
      console.log('   ❌ Patch generation exception:', patchError.message);
      console.log('   📍 Stack:', patchError.stack?.split('\\n').slice(0, 3).join('\\n'));
      return;
    }

    console.log('\n4. Testing conflict detection step...');
    try {
      const conflicts = await conflictDetector.detectConflicts({
        patch: patchResult.patch,
        sourceCode: testRequest.sourceCode,
        ast: astAnalysis.ast,
        filePath: testRequest.filePath
      });

      console.log('   Conflict detection:', conflicts ? '✅ SUCCESS' : '❌ FAILED');
      console.log('   📋 Conflicts found:', conflicts.conflicts?.length || 0);

    } catch (conflictError) {
      console.log('   ❌ Conflict detection exception:', conflictError.message);
    }

    console.log('\n✅ Full API simulation completed successfully!');
    console.log('📋 Final response would include:');
    console.log('   - patch:', patchResult.patch?.length || 0, 'operations');
    console.log('   - preview: available');
    console.log('   - conflicts:', 0);
    console.log('   - suggestions:', patchResult.suggestions?.length || 0);
    console.log('   - confidence:', patchResult.confidence);

  } catch (error) {
    console.log('❌ Service initialization failed:', error.message);
    console.log('📍 Stack:', error.stack?.split('\\n').slice(0, 5).join('\\n'));
  }
}

testEndpointLogic().catch(error => {
  console.error('❌ Test failed:', error.message);
  console.error('📍 Stack:', error.stack);
});