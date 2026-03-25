const { v2: cloudinary } = require('cloudinary');
const dotenv = require('dotenv');

dotenv.config();

console.log('Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Present' : 'Missing',
    api_key: process.env.CLOUDINARY_API_KEY ? 'Present' : 'Missing',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing'
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  // Additional settings for better reliability
  timeout: 60000, // 60 second timeout
  upload_prefix: 'https://api.cloudinary.com'
});

// Test connection
cloudinary.api.ping()
  .then(() => console.log('✅ Cloudinary connected successfully'))
  .catch((err) => console.error('❌ Cloudinary connection failed:', err.message));

module.exports = cloudinary;
