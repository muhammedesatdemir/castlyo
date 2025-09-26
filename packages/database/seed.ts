import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';

import { subscriptionPlans } from './schema/subscriptions';

dotenv.config({ path: '../../dev.env' });

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://castlyo:castlyo_password@localhost:5432/castlyo';

type InsertPlan = typeof subscriptionPlans.$inferInsert;

async function seed() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);

  // Şemanın kabul ettiği alanlara indirgenmiş seed verisi
  const plans: InsertPlan[] = [
    {
      id: randomUUID(),
      name: 'Standart Üyelik',
      planType: 'PRO',
      priceCents: 19900,
      durationDays: 90,
      isActive: true,
    },
    {
      id: randomUUID(),
      name: 'Öne Çıkma',
      planType: 'PRO',
      priceCents: 7900,
      durationDays: 30,
      isActive: true,
    },
    {
      id: randomUUID(),
      name: 'Başvuru Paketi (5 ilan)',
      planType: 'FREE',
      priceCents: 5900,
      durationDays: 30,
      isActive: true,
    },
    {
      id: randomUUID(),
      name: 'Ajans Pro',
      planType: 'TEAM',
      priceCents: 19990,
      durationDays: 30,
      isActive: true,
    },
  ] satisfies InsertPlan[]; // fazladan alanı anında yakalamak için güzel bir sigorta

  await db.insert(subscriptionPlans).values(plans).onConflictDoNothing();

  await sql.end();
  console.log('🌱 Seed complete');
}

seed().catch((e) => {
  console.error('💥 Seed failed:', e);
  process.exit(1);
});
