import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and, or, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../config/database.module';
import { 
  users,
  agencyProfiles,
  talentProfiles
} from '@packages/database/schema/users';
import { 
  messageThreads,
  messages
} from '@packages/database/schema/messages';
import { ContactPermissionsService } from './contact-permissions.service';
import { 
  CreateMessageThreadDto,
  SendMessageDto
} from './dto/message.dto';
import type { Database } from '@packages/database';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private contactPermissionsService: ContactPermissionsService,
  ) {}

  async createMessageThread(userId: string, threadData: CreateMessageThreadDto) {
    // Get user details
    const user = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    // Get participant details
    const participant = await this.db.select()
      .from(users)
      .where(eq(users.id, threadData.participantId))
      .limit(1);

    if (!participant.length) {
      throw new NotFoundException('Participant not found');
    }

    // Verify users have different roles (agency <-> talent)
    if (user[0].role === participant[0].role) {
      throw new BadRequestException('Messages can only be sent between agencies and talents');
    }

    // If this is related to a job application, check contact permissions
    if (threadData.jobApplicationId) {
      const agencyId = user[0].role === 'AGENCY' ? userId : threadData.participantId;
      const talentId = user[0].role === 'TALENT' ? userId : threadData.participantId;

      const permission = await this.contactPermissionsService.checkContactPermission(agencyId, talentId);
      
      if (!permission.hasPermission || !permission.permissionType.includes('messaging')) {
        throw new ForbiddenException('Contact permission required for messaging');
      }
    }

    // Check if thread already exists between these users
    const existingThread = await this.db.select()
      .from(messageThreads)
      .where(
        or(
          and(
            eq(messageThreads.user1Id, userId),
            eq(messageThreads.user2Id, threadData.participantId)
          ),
          and(
            eq(messageThreads.user1Id, threadData.participantId),
            eq(messageThreads.user2Id, userId)
          )
        )
      )
      .limit(1);

    let thread;
    
    if (existingThread.length > 0) {
      thread = existingThread[0];
    } else {
      // Determine agency and talent IDs
      const agencyId = user[0].role === 'AGENCY' ? userId : threadData.participantId;
      const talentId = user[0].role === 'TALENT' ? userId : threadData.participantId;

      // Create new thread
      const newThread = await this.db.insert(messageThreads)
        .values({
          agencyId,
          talentId,
          subject: threadData.subject,
          lastMessageAt: new Date(),
        })
        .returning();

      thread = newThread[0];
    }

    // Send initial message
    await this.sendMessage(userId, {
      threadId: thread.id,
      content: threadData.initialMessage,
      messageType: 'TEXT',
    });

    return thread;
  }

  async sendMessage(userId: string, messageData: SendMessageDto) {
    // Verify thread exists and user has access
    const thread = await this.db.select()
      .from(messageThreads)
      .where(eq(messageThreads.id, messageData.threadId))
      .limit(1);

    if (!thread.length) {
      throw new NotFoundException('Message thread not found');
    }

    const threadData = thread[0];

    // Verify user is part of the thread
    if (threadData.user1Id !== userId && threadData.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    // Create message
    const newMessage = await this.db.insert(messages)
      .values({
        threadId: messageData.threadId,
        senderId: userId,
        content: messageData.content,
        messageType: messageData.messageType || 'TEXT',
        attachmentUrl: messageData.attachmentUrl,
      })
      .returning();

    // Update thread's last message time and unread counts
    const recipientId = threadData.user1Id === userId ? threadData.user2Id : threadData.user1Id;
    
    await this.db.update(messageThreads)
      .set({
        lastMessageAt: new Date(),
        user1UnreadCount: threadData.user1Id === recipientId 
          ? threadData.user1UnreadCount + 1 
          : threadData.user1UnreadCount,
        user2UnreadCount: threadData.user2Id === recipientId 
          ? threadData.user2UnreadCount + 1 
          : threadData.user2UnreadCount,
        updatedAt: new Date()
      })
      .where(eq(messageThreads.id, messageData.threadId));

    // TODO: Send push notification to recipient

    return newMessage[0];
  }

  async getMessageThreads(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const threads = await this.db.select({
      thread: messageThreads,
      participant: {
        id: users.id,
        email: users.email,
        role: users.role,
        talent: talentProfiles,
        agency: agencyProfiles,
      }
    })
      .from(messageThreads)
      .leftJoin(
        users,
        or(
          and(
            eq(messageThreads.user1Id, userId),
            eq(users.id, messageThreads.user2Id)
          ),
          and(
            eq(messageThreads.user2Id, userId),
            eq(users.id, messageThreads.user1Id)
          )
        )
      )
      .leftJoin(talentProfiles, eq(users.id, talentProfiles.userId))
      .leftJoin(agencyProfiles, eq(users.id, agencyProfiles.userId))
      .where(
        or(
          eq(messageThreads.user1Id, userId),
          eq(messageThreads.user2Id, userId)
        )
      )
      .orderBy(desc(messageThreads.lastMessageAt))
      .limit(limit)
      .offset(offset);

    return threads;
  }

  async getThreadMessages(userId: string, threadId: string, page = 1, limit = 50) {
    // Verify user has access to thread
    const thread = await this.db.select()
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);

    if (!thread.length) {
      throw new NotFoundException('Message thread not found');
    }

    const threadData = thread[0];

    if (threadData.user1Id !== userId && threadData.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    const offset = (page - 1) * limit;

    const threadMessages = await this.db.select({
      message: messages,
      sender: {
        id: users.id,
        role: users.role,
        talent: talentProfiles,
        agency: agencyProfiles,
      }
    })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(talentProfiles, eq(users.id, talentProfiles.userId))
      .leftJoin(agencyProfiles, eq(users.id, agencyProfiles.userId))
      .where(eq(messages.threadId, threadId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    // Mark messages as read for this user
    await this.markThreadAsRead(userId, threadId);

    return {
      thread: threadData,
      messages: threadMessages.reverse(), // Reverse to show oldest first
    };
  }

  async markThreadAsRead(userId: string, threadId: string) {
    const thread = await this.db.select()
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);

    if (!thread.length) {
      return;
    }

    const threadData = thread[0];

    // Reset unread count for the current user
    const updateData: any = { updatedAt: new Date() };
    
    if (threadData.user1Id === userId) {
      updateData.user1UnreadCount = 0;
    } else if (threadData.user2Id === userId) {
      updateData.user2UnreadCount = 0;
    }

    await this.db.update(messageThreads)
      .set(updateData)
      .where(eq(messageThreads.id, threadId));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const threads = await this.db.select()
      .from(messageThreads)
      .where(
        or(
          eq(messageThreads.user1Id, userId),
          eq(messageThreads.user2Id, userId)
        )
      );

    let totalUnread = 0;
    
    for (const thread of threads) {
      if (thread.user1Id === userId) {
        totalUnread += thread.user1UnreadCount;
      } else if (thread.user2Id === userId) {
        totalUnread += thread.user2UnreadCount;
      }
    }

    return totalUnread;
  }

  async deleteThread(userId: string, threadId: string) {
    // Verify thread exists and user has access
    const thread = await this.db.select()
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);

    if (!thread.length) {
      throw new NotFoundException('Message thread not found');
    }

    const threadData = thread[0];

    if (threadData.user1Id !== userId && threadData.user2Id !== userId) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    // Soft delete - mark as deleted for the user
    const updateData: any = { updatedAt: new Date() };
    
    if (threadData.user1Id === userId) {
      updateData.user1Deleted = true;
    } else {
      updateData.user2Deleted = true;
    }

    await this.db.update(messageThreads)
      .set(updateData)
      .where(eq(messageThreads.id, threadId));

    return { success: true, message: 'Thread deleted successfully' };
  }
}
