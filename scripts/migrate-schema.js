#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load environment variables
require('dotenv').config({ path: 'dev.env' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://castlyo:castlyo_password@localhost:5432/castlyo';

async function runMigration() {
  const sql = postgres(DATABASE_URL, {
    max: 1, // Use only one connection for migration
  });

  try {
    console.log('🔄 Starting schema migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../packages/database/migrations/0002_schema_updates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== 'COMMIT');
    
    console.log(`📝 Found ${statements.length} migration statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await sql.unsafe(statement);
        console.log(`✅ Statement ${i + 1} completed successfully`);
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        
        // Continue with other statements unless it's a critical error
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log(`⚠️  Non-critical error, continuing...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('🎉 Schema migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration };
