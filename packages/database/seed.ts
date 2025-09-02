import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { subscriptionPlans, userEntitlements } from './schema';

dotenv.config({ path: '../../dev.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://castlyo:castlyo_password@localhost:5432/castlyo';

async function seed() {
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Seeding database...');

  try {
    // Seed subscription plans
    await db.insert(subscriptionPlans).values([
      {
        id: crypto.randomUUID(),
        name: 'Aday Free',
        description: 'Yetenekler için ücretsiz plan',
        userType: 'TALENT',
        price: 0,
        currency: 'TRY',
        billingInterval: 'MONTHLY',
        features: ['Profil oluşturma', 'İlan görüntüleme', '5 başvuru/ay'],
        isActive: true,
        sortOrder: 1,
        trialDays: 0
      },
      {
        id: crypto.randomUUID(),
        name: 'Aday Premium',
        description: 'Yetenekler için premium plan',
        userType: 'TALENT',
        price: 29.99,
        currency: 'TRY',
        billingInterval: 'MONTHLY',
        features: ['Sınırsız başvuru', 'Öncelikli görünürlük', 'Gelişmiş profil'],
        isActive: true,
        sortOrder: 2,
        trialDays: 7
      },
      {
        id: crypto.randomUUID(),
        name: 'Ajans Başlangıç',
        description: 'Küçük ajanslar için başlangıç paketi',
        userType: 'AGENCY',
        price: 99.99,
        currency: 'TRY',
        billingInterval: 'MONTHLY',
        features: ['5 aktif ilan', '50 başvuru görüntüleme', 'Temel iletişim'],
        isActive: true,
        sortOrder: 3,
        trialDays: 14
      },
      {
        id: crypto.randomUUID(),
        name: 'Ajans Pro',
        description: 'Büyük ajanslar için profesyonel paket',
        userType: 'AGENCY',
        price: 299.99,
        currency: 'TRY',
        billingInterval: 'MONTHLY',
        features: ['Sınırsız ilan', 'Sınırsız başvuru', 'Öncelikli destek', 'Analitik raporlar'],
        isActive: true,
        sortOrder: 4,
        trialDays: 14
      }
    ]).onConflictDoNothing();

    console.log('✅ Subscription plans seeded successfully');

    // You can add more seed data here for:
    // - Admin users
    // - Default settings
    // - System notifications templates
    // - etc.

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

seed()
  .then(() => {
    console.log('🌱 Database seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
