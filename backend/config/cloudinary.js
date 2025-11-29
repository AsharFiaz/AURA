const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Validate that all required environment variables are present
const requiredEnvVars = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value || value.trim() === '' || value === 'your_cloud_name' || value === 'your_api_key' || value === 'your_api_secret')
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('❌ Missing or invalid Cloudinary environment variables:', missingVars.join(', '));
  console.error('Please set these in your .env file with your actual Cloudinary credentials.');
} else {
  console.log('✅ Cloudinary environment variables loaded successfully');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

module.exports = cloudinary;

