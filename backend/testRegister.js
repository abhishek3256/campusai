const axios = require('axios');
axios.post('http://localhost:5000/api/auth/register', {email: 'testuser2', password: 'password123', role: 'student', name: 'Test User', gender: 'male', phone: '1234567890'})
    .then(res => console.log('success:', res.data))
    .catch(err => console.error(err.response ? err.response.data : err.message));
