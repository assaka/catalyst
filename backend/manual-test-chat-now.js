/**
 * Manual test of chat API - run immediately
 */

const https = require('https');

const RENDER_URL = 'https://catalyst-backend-g5dd.onrender.com';

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

async function testNow() {
  console.log('🧪 Testing Chat API NOW...\n');

  try {
    // Check health first
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await makeRequest(`${RENDER_URL}/health`);
    console.log(`   Status: ${healthResponse.status}`);

    if (healthResponse.status !== 200) {
      console.log('❌ Server not responding');
      return;
    }
    console.log('✅ Server is UP\n');

    // Test chat endpoints
    console.log('2️⃣ Creating conversation...');
    const createResponse = await makeRequest(`${RENDER_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        customer_name: 'Manual Test User',
        customer_email: 'test@example.com'
      }
    });

    console.log(`   Status: ${createResponse.status}`);

    if (createResponse.status === 200 && createResponse.data.success) {
      const conversationId = createResponse.data.conversation.id;
      console.log(`✅ Conversation created: ${conversationId}\n`);

      console.log('3️⃣ Sending message...');
      const messageResponse = await makeRequest(
        `${RENDER_URL}/api/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            message_text: 'Hello from manual test!',
            sender_type: 'customer'
          }
        }
      );

      console.log(`   Status: ${messageResponse.status}`);

      if (messageResponse.status === 200) {
        console.log('✅ Message sent successfully!\n');

        console.log('🎉 CHAT API IS WORKING!');
        console.log('✅ You can now use the chat widget in your browser');
      } else {
        console.log('❌ Message failed');
        console.log('Response:', messageResponse);
      }
    } else {
      console.log('❌ Conversation creation failed');
      console.log('Response:', createResponse);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNow();
