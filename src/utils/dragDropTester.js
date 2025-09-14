/**
 * Drag and Drop Test Utility for CartSlotsEditor
 * This utility helps test and debug drag and drop functionality
 */

export class DragDropTester {
  constructor() {
    this.testResults = [];
    this.currentTest = null;
  }

  /**
   * Start a new test
   */
  startTest(testName) {
    this.currentTest = {
      name: testName,
      startTime: Date.now(),
      steps: [],
      errors: [],
      passed: true
    };
    console.log(`🧪 Starting test: ${testName}`);
  }

  /**
   * Log a test step
   */
  logStep(description, data = {}) {
    if (!this.currentTest) {
      console.error('No test currently running');
      return;
    }

    const step = {
      description,
      data,
      timestamp: Date.now()
    };

    this.currentTest.steps.push(step);
    console.log(`  ➡️ ${description}`, data);
  }

  /**
   * Log an error
   */
  logError(error, context = {}) {
    if (!this.currentTest) {
      console.error('No test currently running');
      return;
    }

    this.currentTest.errors.push({
      error: error.message || error,
      context,
      timestamp: Date.now()
    });
    this.currentTest.passed = false;
    console.error(`  ❌ Error: ${error.message || error}`, context);
  }

  /**
   * End the current test
   */
  endTest() {
    if (!this.currentTest) {
      console.error('No test currently running');
      return;
    }

    this.currentTest.endTime = Date.now();
    this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;

    const result = this.currentTest.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`🧪 Test completed: ${this.currentTest.name} - ${result} (${this.currentTest.duration}ms)`);

    this.testResults.push(this.currentTest);
    this.currentTest = null;
  }

  /**
   * Test slot configuration drag and drop
   */
  async testSlotDragDrop(handleSlotDrop, currentConfig) {
    this.startTest('Slot Drag and Drop');

    try {
      // Test 1: Verify initial state
      this.logStep('Verifying initial configuration', {
        slotsCount: Object.keys(currentConfig.slots).length,
        hasMainLayout: !!currentConfig.slots.main_layout,
        mainLayoutParent: currentConfig.slots.main_layout?.parentId
      });

      if (!currentConfig.slots.main_layout || currentConfig.slots.main_layout.parentId !== null) {
        this.logError('main_layout has incorrect parentId', {
          expected: null,
          actual: currentConfig.slots.main_layout?.parentId
        });
      }

      // Test 2: Simulate drag operation
      const testDraggedSlotId = 'empty_cart_title';
      const testTargetSlotId = 'empty_cart_button';
      const testDropPosition = 'after';

      this.logStep('Simulating drag operation', {
        draggedSlot: testDraggedSlotId,
        targetSlot: testTargetSlotId,
        dropPosition: testDropPosition
      });

      // Call the actual drag handler
      await handleSlotDrop(testDraggedSlotId, testTargetSlotId, testDropPosition);

      this.logStep('Drag operation completed');

      // Test 3: Verify the result
      // This would need to be checked after the state updates
      setTimeout(() => {
        this.logStep('Verifying post-drag state (delayed check)');
        // The actual verification would happen here
        this.endTest();
      }, 200);

    } catch (error) {
      this.logError(error);
      this.endTest();
    }
  }

  /**
   * Test validation function
   */
  testValidateSlotConfiguration(validateFn, testConfig) {
    this.startTest('Slot Configuration Validation');

    try {
      // Test valid configuration
      this.logStep('Testing valid configuration');
      const isValid = validateFn(testConfig.slots);
      if (!isValid) {
        this.logError('Valid configuration failed validation');
      }

      // Test invalid configurations
      this.logStep('Testing invalid configuration - null slots');
      const invalidResult1 = validateFn(null);
      if (invalidResult1) {
        this.logError('Null slots passed validation');
      }

      // Test missing viewMode
      const testSlotsNoViewMode = { ...testConfig.slots };
      testSlotsNoViewMode.test_slot = {
        id: 'test_slot',
        type: 'text',
        viewMode: 'invalid' // Not an array
      };

      this.logStep('Testing invalid viewMode');
      const invalidResult2 = validateFn(testSlotsNoViewMode);
      if (invalidResult2) {
        this.logError('Invalid viewMode passed validation');
      }

      // Test orphaned slot
      const testSlotsOrphaned = { ...testConfig.slots };
      testSlotsOrphaned.orphan_slot = {
        id: 'orphan_slot',
        type: 'text',
        parentId: 'non_existent_parent'
      };

      this.logStep('Testing orphaned slot');
      const invalidResult3 = validateFn(testSlotsOrphaned);
      if (invalidResult3) {
        this.logError('Orphaned slot passed validation');
      }

      this.endTest();
    } catch (error) {
      this.logError(error);
      this.endTest();
    }
  }

  /**
   * Get test summary
   */
  getSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(t => t.passed).length;
    const failed = total - passed;

    console.log('');
    console.log('📊 Test Summary');
    console.log('═══════════════');
    console.log(`Total tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('');

    if (failed > 0) {
      console.log('Failed tests:');
      this.testResults.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}`);
        test.errors.forEach(error => {
          console.log(`    └─ ${error.error}`);
        });
      });
    }

    return {
      total,
      passed,
      failed,
      results: this.testResults
    };
  }
}

// Export a singleton instance
export const dragDropTester = new DragDropTester();

/**
 * Run all drag and drop tests
 */
export async function runDragDropTests(handleSlotDrop, validateSlotConfiguration, currentConfig) {
  console.log('🚀 Starting Drag and Drop Test Suite');
  console.log('=====================================');

  const tester = new DragDropTester();

  // Run validation tests
  tester.testValidateSlotConfiguration(validateSlotConfiguration, currentConfig);

  // Run drag drop tests
  await tester.testSlotDragDrop(handleSlotDrop, currentConfig);

  // Wait for async tests to complete
  setTimeout(() => {
    const summary = tester.getSummary();
    console.log('Tests completed:', summary);
  }, 500);

  return tester;
}

export default DragDropTester;