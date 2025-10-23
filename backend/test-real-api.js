require('dotenv').config();
const express = require('express');
const customersRouter = require('./src/routes/customers');

// Create a minimal test server
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
app.use((req, res, next) => {
  req.user = {
    id: 'test-user',
    role: 'admin' // Simulate admin user
  };
  next();
});

app.use('/api/customers', customersRouter);

const PORT = 3099;

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('\n📝 Test the API with:');
  console.log(`curl "http://localhost:${PORT}/api/customers?store_id=157d4590-49bf-4b0b-bd77-abe131909528" | jq '.data.customers[] | select(.email == "haha@test.nl") | {email, customer_type, address_data}'`);
  console.log('\nPress Ctrl+C to stop');
});
