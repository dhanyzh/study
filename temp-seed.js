const jwt = require('jsonwebtoken');

async function runSeed() {
  const secret = 'study-os-super-secret-jwt-key-change-me-in-production-2024';
  const token = jwt.sign(
    { 
      userId: 'dummy_id_for_admin',
      username: 'admindhanis',
      role: 'super_admin' 
    },
    secret,
    { expiresIn: '1h' }
  );

  const baseUrl = 'https://study-zeta-lyart.vercel.app';

  console.log('Running main seed...');
  try {
    const res1 = await fetch(`${baseUrl}/api/admin/seed-db`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const text1 = await res1.text();
    console.log('Result 1:', text1);
    
    console.log('\nRunning chemistry seed...');
    const res2 = await fetch(`${baseUrl}/api/admin/seed-chemistry`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const text2 = await res2.text();
    console.log('Result 2:', text2);

  } catch (err) {
    console.error('Error:', err);
  }
}

runSeed();
