import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '@packages/database/schema/users';
import { DATABASE_CONNECTION } from '../../config/database.module';
import type { Database } from '@packages/database';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async create(userData: any) {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
}
