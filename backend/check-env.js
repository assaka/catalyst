require('dotenv').config();
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
console.log('Environment:', process.env.NODE_ENV || 'development');
