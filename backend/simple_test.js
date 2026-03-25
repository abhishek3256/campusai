const http = require('http');
const fs = require('fs');

const data = JSON.stringify({
  email: 'unique_user_' + Date.now(),
  password: 'password123',
  role: 'student',
  name: 'Test',
  gender: 'male',
  phone: '123'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let responseBody = '';
  res.on('data', chunk => responseBody += chunk);
  res.on('end', () => {
    fs.writeFileSync('C:/Users/Acer Nitro/Desktop/campusai/backend/test_result_api.txt', `STATUS: ${res.statusCode}\nBODY: ${responseBody}`);
    console.log('Test complete');
  });
});

req.on('error', error => {
  fs.writeFileSync('C:/Users/Acer Nitro/Desktop/campusai/backend/test_result_api.txt', `ERROR: ${error.message}`);
  console.log('Test complete with error');
});

req.write(data);
req.end();
