import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '@castlyo/database';
import { DATABASE_CONNECTION } from '../../config/database.module';
import type { Database } from '@castlyo/database';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  async findByEmail(email: string) {
    this.logger.debug(`[findByEmail] Searching for user: ${email}`);
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findById(id: string) {
    this.logger.debug(`[findById] Searching for user: ${id}`);
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async create(userData: any) {
    this.logger.log(`[create] Creating user: ${userData.email}`);
    const result = await this.db.insert(users).values(userData).returning();
    return result[0];
  }

  async completeOnboarding(userId: string) {
    this.logger.log(`[completeOnboarding] Completing onboarding for user: ${userId}`);
    
    const result = await this.db
      .update(users)
      .set({ 
        onboardingCompleted: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    this.logger.log(`[completeOnboarding] Success for user: ${userId}`);
    return result[0];
  }
}
