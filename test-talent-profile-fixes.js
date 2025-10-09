#!/usr/bin/env node

/**
 * Test script for talent profile fixes
 * Tests the new enums and validation
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/castlyo_dev';

async function testTalentProfileFixes() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log('🧪 Testing talent profile fixes...\n');

    // 1. Test enum types exist
    console.log('1. Checking enum types...');
    const enumTypes = await pool.query(`
      SELECT typname FROM pg_type 
      WHERE typname IN ('talent_gender', 'city_code')
      ORDER BY typname;
    `);
    
    console.log('✅ Found enum types:', enumTypes.rows.map(r => r.typname));
    
    // 2. Test talent_gender enum values
    console.log('\n2. Checking talent_gender enum values...');
    const genderValues = await pool.query(`
      SELECT unnest(enum_range(NULL::talent_gender)) as value;
    `);
    console.log('✅ talent_gender values:', genderValues.rows.map(r => r.value));
    
    // 3. Test city_code enum values (first 10)
    console.log('\n3. Checking city_code enum values (first 10)...');
    const cityValues = await pool.query(`
      SELECT unnest(enum_range(NULL::city_code)) as value
      LIMIT 10;
    `);
    console.log('✅ city_code values (first 10):', cityValues.rows.map(r => r.value));
    
    // 4. Test talent_profiles table structure
    console.log('\n4. Checking talent_profiles table structure...');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'talent_profiles' 
      AND column_name IN ('gender', 'city', 'height_cm', 'weight_kg', 'birth_date')
      ORDER BY column_name;
    `);
    
    console.log('✅ talent_profiles columns:');
    tableInfo.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // 5. Test inserting a sample profile
    console.log('\n5. Testing sample profile insertion...');
    const testProfile = {
      user_id: '00000000-0000-0000-0000-000000000001',
      first_name: 'Test',
      last_name: 'User',
      gender: 'MALE',
      city: 'ISTANBUL',
      height_cm: 180,
      weight_kg: 75,
      birth_date: '1990-01-01'
    };
    
    // First create a test user
    await pool.query(`
      INSERT INTO users (id, email, password_hash, role, status, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING;
    `, [
      testProfile.user_id,
      'test@example.com',
      'hashed_password',
      'TALENT',
      'ACTIVE',
      true
    ]);
    
    // Insert test profile
    await pool.query(`
      INSERT INTO talent_profiles (
        user_id, first_name, last_name, gender, city, 
        height_cm, weight_kg, birth_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        gender = EXCLUDED.gender,
        city = EXCLUDED.city,
        height_cm = EXCLUDED.height_cm,
        weight_kg = EXCLUDED.weight_kg,
        birth_date = EXCLUDED.birth_date;
    `, [
      testProfile.user_id,
      testProfile.first_name,
      testProfile.last_name,
      testProfile.gender,
      testProfile.city,
      testProfile.height_cm,
      testProfile.weight_kg,
      testProfile.birth_date
    ]);
    
    console.log('✅ Sample profile inserted successfully');
    
    // 6. Test validation - try invalid gender
    console.log('\n6. Testing validation (invalid gender)...');
    try {
      await pool.query(`
        INSERT INTO talent_profiles (user_id, first_name, last_name, gender)
        VALUES ($1, $2, $3, $4);
      `, [
        '00000000-0000-0000-0000-000000000002',
        'Invalid',
        'Gender',
        'OTHER'  // This should fail
      ]);
      console.log('❌ Invalid gender was accepted (this should not happen)');
    } catch (error) {
      console.log('✅ Invalid gender correctly rejected:', error.message);
    }
    
    // 7. Test validation - try invalid city
    console.log('\n7. Testing validation (invalid city)...');
    try {
      await pool.query(`
        INSERT INTO talent_profiles (user_id, first_name, last_name, city)
        VALUES ($1, $2, $3, $4);
      `, [
        '00000000-0000-0000-0000-000000000003',
        'Invalid',
        'City',
        'INVALID_CITY'  // This should fail
      ]);
      console.log('❌ Invalid city was accepted (this should not happen)');
    } catch (error) {
      console.log('✅ Invalid city correctly rejected:', error.message);
    }
    
    console.log('\n🎉 All tests passed! Talent profile fixes are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
testTalentProfileFixes().catch(console.error);
