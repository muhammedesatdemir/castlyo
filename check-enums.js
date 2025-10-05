const postgres = require('postgres');

async function checkEnums() {
  try {
    console.log('🔍 Checking enum values...\n');
    
    const connectionString = 'postgresql://postgres:postgres@localhost:5432/castlyo';
    const sql = postgres(connectionString);
    
    // Check job_status enum values
    console.log('1. Checking job_status enum values...');
    const jobStatusValues = await sql`
      SELECT unnest(enum_range(NULL::job_status)) as value
    `;
    
    console.log('✅ job_status enum values:');
    jobStatusValues.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.value}`);
    });
    
    // Check other enums
    console.log('\n2. Checking other enum types...');
    const enumTypes = await sql`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typtype = 'e'
      ORDER BY t.typname, e.enumsortorder
    `;
    
    const enumGroups = {};
    enumTypes.forEach(row => {
      if (!enumGroups[row.enum_name]) {
        enumGroups[row.enum_name] = [];
      }
      enumGroups[row.enum_name].push(row.enum_value);
    });
    
    Object.keys(enumGroups).forEach(enumName => {
      console.log(`✅ ${enumName}: ${enumGroups[enumName].join(', ')}`);
    });
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error checking enums:', error.message);
  }
}

checkEnums();
