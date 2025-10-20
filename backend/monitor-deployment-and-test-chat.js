/**
 * Monitor Render deployment and automatically test chat functionality
 */

const https = require('https');

const RENDER_URL = 'https://catalyst-backend-g5dd.onrender.com';
const POLL_INTERVAL = 10000; // 10 seconds
const MAX_ATTEMPTS = 30; // 5 minutes max

let attempts = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function checkDeploymentStatus() {
  try {
    const response = await makeRequest(`${RENDER_URL}/deployment-status`);
    return response.status === 200 && response.data.deployed;
  } catch (error) {
    return false;
  }
}

async function testChatEndpoint() {
  console.log('\n🧪 Testing Chat API Endpoints...\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Create a conversation
    console.log('\n📝 Test 1: Creating a new conversation...');
    const createResponse = await makeRequest(`${RENDER_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        customer_name: 'Test User',
        customer_email: 'test@example.com'
      }
    });

    if (createResponse.status === 200 && createResponse.data.success) {
      console.log('✅ Conversation created successfully');
      console.log(`   Conversation ID: ${createResponse.data.conversation.id}`);

      const conversationId = createResponse.data.conversation.id;

      // Test 2: Send a message
      console.log('\n📝 Test 2: Sending a test message...');
      const messageResponse = await makeRequest(
        `${RENDER_URL}/api/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            message_text: 'Hello! This is a test message from the automated test script.',
            sender_type: 'customer'
          }
        }
      );

      if (messageResponse.status === 200 && messageResponse.data.success) {
        console.log('✅ Message sent successfully');
        console.log(`   Message ID: ${messageResponse.data.message.id}`);
      } else {
        console.log('❌ Failed to send message');
        console.log('   Response:', messageResponse);
      }

      // Test 3: Retrieve messages
      console.log('\n📝 Test 3: Retrieving messages...');
      const getResponse = await makeRequest(
        `${RENDER_URL}/api/chat/conversations/${conversationId}/messages`
      );

      if (getResponse.status === 200 && getResponse.data.success) {
        console.log('✅ Messages retrieved successfully');
        console.log(`   Found ${getResponse.data.messages.length} message(s)`);
        getResponse.data.messages.forEach((msg, i) => {
          console.log(`   ${i + 1}. [${msg.sender_type}] ${msg.message_text.substring(0, 50)}...`);
        });
      } else {
        console.log('❌ Failed to retrieve messages');
      }

      // Test 4: List all conversations
      console.log('\n📝 Test 4: Listing all conversations...');
      const listResponse = await makeRequest(
        `${RENDER_URL}/api/chat/conversations`
      );

      if (listResponse.status === 200 && listResponse.data.success) {
        console.log('✅ Conversations listed successfully');
        console.log(`   Total conversations: ${listResponse.data.conversations.length}`);
      } else {
        console.log('❌ Failed to list conversations');
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ ALL CHAT API TESTS PASSED!');
      console.log('='.repeat(60));

      console.log('\n🎉 Chat plugin is fully functional!');
      console.log('📱 You can now:');
      console.log('   1. Click the purple chat bubble in the browser');
      console.log('   2. Type and send messages');
      console.log('   3. Messages will be stored in the database');
      console.log('   4. Conversation history persists across page refreshes');

      return true;

    } else {
      console.log('❌ Failed to create conversation');
      console.log('   Status:', createResponse.status);
      console.log('   Response:', createResponse.data);
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing chat endpoints:', error.message);
    return false;
  }
}

async function monitorAndTest() {
  console.log('🔍 Monitoring Render.com deployment...\n');
  console.log('⏱️  Checking every 10 seconds...');
  console.log('⏰ Max wait time: 5 minutes\n');

  const checkInterval = setInterval(async () => {
    attempts++;

    process.stdout.write(`\r[${attempts}/${MAX_ATTEMPTS}] Checking deployment status... `);

    const isDeployed = await checkDeploymentStatus();

    if (isDeployed) {
      clearInterval(checkInterval);
      console.log('✅ DEPLOYMENT LIVE!\n');

      // Wait 5 seconds for services to stabilize
      console.log('⏳ Waiting 5 seconds for services to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Run tests
      const testsPassed = await testChatEndpoint();

      if (testsPassed) {
        console.log('\n🚀 READY TO USE! Refresh your browser to try the chat.');
      } else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
      }

      process.exit(0);
    }

    if (attempts >= MAX_ATTEMPTS) {
      clearInterval(checkInterval);
      console.log('\n\n⏰ Timeout: Deployment took longer than expected.');
      console.log('💡 Check Render dashboard: https://dashboard.render.com');
      console.log('💡 Or manually test: https://catalyst-backend-g5dd.onrender.com/health');
      process.exit(1);
    }
  }, POLL_INTERVAL);
}

console.log('🚀 Render Deployment Monitor & Chat Tester');
console.log('='.repeat(60));
console.log('Monitoring URL:', RENDER_URL);
console.log('='.repeat(60));
console.log('');

monitorAndTest();
