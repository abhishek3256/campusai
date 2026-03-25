const axios = require('axios');
const fs = require('fs');

async function test() {
  let log = '';
  const serverRunning = await axios.get('http://localhost:5000/api/auth/profile').catch(e => e.message);
  log += 'Server Status: ' + serverRunning + '\n';
  
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {email: 'tu' + Date.now(), password: 'password123', role: 'student', name: 'Test User', gender: 'male', phone: '12'});
    log += 'Register Success: ' + JSON.stringify(res.data) + '\n';
  } catch (e) {
    log += 'Register Error: ' + (e.response ? JSON.stringify(e.response.data) : e.message) + '\n';
  }
  
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {email: 's', password: 'password123'});
    log += 'Login Success: ' + JSON.stringify(res.data) + '\n';
  } catch (e) {
    log += 'Login Error: ' + (e.response ? JSON.stringify(e.response.data) : e.message) + '\n';
  }
  
  fs.writeFileSync('output-log.txt', log);
}
test();
