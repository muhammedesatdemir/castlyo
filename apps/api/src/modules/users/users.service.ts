import { Injectable, Inject, Logger } from '@nestjs/common';
import { DRIZZLE } from '@/config/database.module';
import { eq } from 'drizzle-orm';
import { users } from '@castlyo/database'; // doğru schema import

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  // Base columns - only existing columns in database
  private baseCols = {
    id: users.id, 
    email: users.email, 
    role: users.role,
    status: users.status, 
    emailVerified: users.emailVerified,
    createdAt: users.createdAt, 
    updatedAt: users.updatedAt,
    passwordHash: users.passwordHash,
  };

  async findByEmail(email: string) {
    try {
      this.logger.log(`[findByEmail] Searching for email: ${email}`);
      
      // Test with simple select first
      const testResult = await this.db.select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
        status: users.status,
        emailVerified: users.emailVerified,
      }).from(users).where(eq(users.email, email)).limit(1);
      
      this.logger.log(`[findByEmail] Test query result: ${testResult.length > 0 ? 'Found' : 'Not found'}`);
      
      if (testResult.length > 0) {
        const user = testResult[0];
        this.logger.log(`[findByEmail] User details: id=${user.id}, status=${user.status}, emailVerified=${user.emailVerified}`);
        return user;
      }
      
      return null;
    } catch (e) {
      this.logger.error(`[findByEmail] DB error for ${email}: ${(e as Error).message}`);
      this.logger.error(`[findByEmail] Error stack:`, e.stack);
      throw e;
    }
  }

  async findById(id: string) {
    this.logger.debug(`[findById] Searching for user: ${id}`);
    
    const result = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] || null;
  }

  async create(payload: { 
    email: string; 
    passwordHash: string; 
    role: string; 
    status?: string; 
    emailVerified?: boolean; 
  }) {
    const [row] = await this.db.insert(users).values({
      email: payload.email,
      passwordHash: payload.passwordHash,
      role: payload.role as any,
      status: payload.status as any,
      emailVerified: payload.emailVerified,
    }).returning(this.baseCols);

    return row;
  }

  async completeOnboarding(userId: string) {
    this.logger.log(`[completeOnboarding] Completing onboarding for user: ${userId}`);
    
    const result = await this.db
      .update(users)
      .set({ 
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
