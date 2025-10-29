/**
 * Test if export default named functions work with our parser
 */

// Simulate the App.jsx code parser
function createHandlerFromDatabaseCode(code) {
  try {
    let cleanCode = code.trim();
    if (cleanCode.startsWith('export default')) {
      cleanCode = cleanCode.replace(/^export\s+default\s+/, '');
    }
    cleanCode = cleanCode.replace(/;\s*$/, '');
    if (cleanCode.startsWith('async function') || cleanCode.startsWith('function')) {
      cleanCode = '(' + cleanCode + ')';
    } else if (!cleanCode.startsWith('(')) {
      cleanCode = '(' + cleanCode + ')';
    }

    console.log('📝 Transformed to:');
    console.log(cleanCode);
    console.log('');

    const handler = new Function('return ' + cleanCode)();
    console.log('✅ Success! Handler type:', typeof handler);
    console.log('📛 Function name:', handler.name);
    return handler;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

console.log('='.repeat(60));
console.log('TEST 1: export default named function');
console.log('='.repeat(60));

const namedFunctionCode = `export default function onCartViewed(data) {
  console.log('cart.viewed fired:', data);
}`;

console.log('Original code:');
console.log(namedFunctionCode);
console.log('');

const handler1 = createHandlerFromDatabaseCode(namedFunctionCode);
if (handler1) {
  console.log('\n🧪 Testing execution:');
  handler1({ test: 'named function data' });
}

console.log('\n');
console.log('='.repeat(60));
console.log('TEST 2: Arrow function');
console.log('='.repeat(60));

const arrowFunctionCode = `(eventData) => {
  console.log('cart.viewed fired:', eventData);
}`;

console.log('Original code:');
console.log(arrowFunctionCode);
console.log('');

const handler2 = createHandlerFromDatabaseCode(arrowFunctionCode);
if (handler2) {
  console.log('\n🧪 Testing execution:');
  handler2({ test: 'arrow function data' });
}

console.log('\n');
console.log('='.repeat(60));
console.log('TEST 3: async named function');
console.log('='.repeat(60));

const asyncFunctionCode = `export default async function onCartViewed(data) {
  console.log('cart.viewed fired (async):', data);
  return 'async result';
}`;

console.log('Original code:');
console.log(asyncFunctionCode);
console.log('');

const handler3 = createHandlerFromDatabaseCode(asyncFunctionCode);
if (handler3) {
  console.log('\n🧪 Testing execution:');
  handler3({ test: 'async function data' }).then(result => {
    console.log('Returned:', result);
  });
}
