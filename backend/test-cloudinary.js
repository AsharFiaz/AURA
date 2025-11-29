// Test script to verify Cloudinary configuration
// Run with: node test-cloudinary.js

require('dotenv').config();
const cloudinary = require('./config/cloudinary');

console.log('\n🧪 Testing Cloudinary Configuration...\n');

// Check environment variables
console.log('Environment Variables Check:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set (hidden)' : '❌ Missing');
console.log('');

// Test Cloudinary connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error('❌ Cloudinary connection failed:');
    console.error('Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your CLOUDINARY_CLOUD_NAME is correct');
    console.error('2. Your CLOUDINARY_API_KEY is correct');
    console.error('3. Your CLOUDINARY_API_SECRET is correct');
    console.error('4. You have internet connection');
    process.exit(1);
  } else {
    console.log('✅ Cloudinary connection successful!');
    console.log('Status:', result.status);
    console.log('\nYour Cloudinary configuration is working correctly!');
    process.exit(0);
  }
});

