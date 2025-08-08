// Set environment variables for Windows
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = 'postgresql://postgres.jqqfjfoigtwdpnlicjmh:Lgr5ovbpji64CooD@aws-0-eu-north-1.pooler.supabase.com:6543/postgres';

// Now require and run the test
require('./test-akeneo-image-import.js');