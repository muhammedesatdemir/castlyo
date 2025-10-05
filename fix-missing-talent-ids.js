// Migration script to fix missing talent_id in job_applications
// Run this once to populate talent_id for existing applications

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixMissingTalentIds() {
  console.log('Starting migration to fix missing talent_id in job_applications...');
  
  try {
    const result = await pool.query(`
      UPDATE job_applications ja
      SET talent_id = tp.id
      FROM talent_profiles tp
      WHERE tp.user_id = ja.applicant_user_id
        AND ja.talent_id IS NULL;
    `);
    
    console.log(`Updated ${result.rowCount} job applications with missing talent_id`);
    
    // Verify the fix
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(talent_id) as applications_with_talent_id,
        COUNT(*) - COUNT(talent_id) as applications_without_talent_id
      FROM job_applications;
    `);
    
    console.log('Verification results:', verifyResult.rows[0]);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

fixMissingTalentIds();
