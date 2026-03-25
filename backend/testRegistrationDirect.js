async function test() {
  const req = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'newstudent' + Date.now(), password: 'password123', role: 'student', name: 'Tester', gender: 'male' })
  });
  const data = await req.json();
  console.log('Registration Response:', data);

  const loginReq = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 's', password: 'password123' })
  });
  const loginData = await loginReq.json();
  console.log('Login Response:', loginData);
}
test();
