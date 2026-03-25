const axios = require('axios');
async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {email: 'testuser4', password: 'password123', role: 'student', name: 'Test User', gender: 'male', phone: '1234567890'});
    console.log('Register Success:', res.data);
  } catch (e) {
    console.error('Register Error:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {email: 'testuser4', password: 'password123'});
    console.log('Login Success:', res.data);
  } catch (e) {
    console.error('Login Error:', e.response ? JSON.stringify(e.response.data) : e.message);
  }
}
test();
