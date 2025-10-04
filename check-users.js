require('dotenv/config');
const postgres = require('postgres');

async function checkUsers() {
  const client = postgres(process.env.DATABASE_URL);
  
  try {
    console.log('🔍 Checking users and agencies...');
    
    const users = await client`
      SELECT 
        u.id, 
        u.email, 
        u.role,
        ap.id AS agency_id,
        ap.company_name
      FROM users u 
      LEFT JOIN agency_profiles ap ON ap.user_id = u.id
      ORDER BY u.created_at DESC 
      LIMIT 10
    `;
    
    console.log('👥 Users:');
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (${user.role}) - Agency: ${user.company_name || 'None'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkUsers();
