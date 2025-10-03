import { 
  Injectable, 
  Inject, 
  NotFoundException, 
  ForbiddenException, 
  BadRequestException 
} from '@nestjs/common';
import { eq, and, or, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
// DATABASE_CONNECTION import removed - using 'DRIZZLE' directly
import { 
  users,
  agencyProfiles,
  talentProfiles,
  messageThreads,
  messages,
  contactPermissions,
  db
} from '@castlyo/database';
import { ContactPermissionsService } from './contact-permissions.service';
import { 
  CreateMessageThreadDto,
  SendMessageDto
} from './dto/message.dto';
import type { Database } from '@castlyo/database';

@Injectable()
export class MessagesService {
  private agencyUser = alias(users, 'agency_user');
  private talentUser = alias(users, 'talent_user');

  constructor(
    @Inject('DRIZZLE') private readonly db: Database,
    private contactPermissionsService: ContactPermissionsService,
  ) {}

  async createMessageThread(userId: string, threadData: CreateMessageThreadDto) {
    // Get user details
    const user = await this.db.select({ id: users.id, role: users.role, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    // Get participant details
    const participant = await this.db.select({ id: users.id, role: users.role, email: users.email })
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
      const agencyUserId = user[0].role === 'AGENCY' ? userId : threadData.participantId;
      const talentUserId = user[0].role === 'TALENT' ? userId : threadData.participantId;

      const permission = await this.contactPermissionsService.checkContactPermission(agencyUserId, talentUserId);
      
      if (!permission.hasPermission || !permission.permissionType.includes('messaging')) {
        throw new ForbiddenException('Contact permission required for messaging');
      }
    }

    // Resolve agency/talent profile IDs for both sides
    const currentAgencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId })
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    const currentTalentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    const participantAgencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId })
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, threadData.participantId))
      .limit(1);

    const participantTalentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, threadData.participantId))
      .limit(1);

    const agencyProfileId = (currentAgencyProfile[0]?.id) || (participantAgencyProfile[0]?.id);
    const talentProfileId = (currentTalentProfile[0]?.id) || (participantTalentProfile[0]?.id);

    if (!agencyProfileId || !talentProfileId) {
      throw new BadRequestException('Participants must have agency/talent profiles');
    }

    // Check if thread already exists between these participants
    const existingThread = await this.db.select({ id: messageThreads.id, agencyId: messageThreads.agencyId, talentId: messageThreads.talentId })
      .from(messageThreads)
      .where(
        and(
          eq(messageThreads.agencyId, agencyProfileId),
          eq(messageThreads.talentId, talentProfileId)
        )
      )
      .limit(1);

    let thread;
    
    if (existingThread.length > 0) {
      thread = existingThread[0];
    } else {
      // Create new thread
      const newThread = await this.db.insert(messageThreads)
        .values({
          agencyId: agencyProfileId,
          talentId: talentProfileId,
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
    const thread = await this.db.select({ id: messageThreads.id, agencyId: messageThreads.agencyId, talentId: messageThreads.talentId, agencyUnreadCount: messageThreads.agencyUnreadCount, talentUnreadCount: messageThreads.talentUnreadCount })
      .from(messageThreads)
      .where(eq(messageThreads.id, messageData.threadId))
      .limit(1);

    if (!thread.length) {
      throw new NotFoundException('Message thread not found');
    }

    const threadData: any = thread[0];

    // Verify user is part of the thread by matching their profile
    const userAgencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId })
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    const userTalentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    const isAgencyParticipant = userAgencyProfile.length > 0 && userAgencyProfile[0].id === threadData.agencyId;
    const isTalentParticipant = userTalentProfile.length > 0 && userTalentProfile[0].id === threadData.talentId;

    if (!isAgencyParticipant && !isTalentParticipant) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    // Create message
    const newMessage = await this.db.insert(messages)
      .values({
        threadId: messageData.threadId,
        senderId: userId,
        content: messageData.content,
        messageType: messageData.messageType || 'TEXT',
        attachments: messageData.attachmentUrl ? [{ url: messageData.attachmentUrl }] : [],
      })
      .returning();

    // Update thread's last message time and unread counts
    const incrementAgencyUnread = isTalentParticipant;
    const incrementTalentUnread = isAgencyParticipant;

    await this.db.update(messageThreads)
      .set({
        lastMessageAt: new Date(),
        agencyUnreadCount: incrementAgencyUnread 
          ? (threadData.agencyUnreadCount ?? 0) + 1 
          : (threadData.agencyUnreadCount ?? 0),
        talentUnreadCount: incrementTalentUnread 
          ? (threadData.talentUnreadCount ?? 0) + 1 
          : (threadData.talentUnreadCount ?? 0),
        updatedAt: new Date()
      })
      .where(eq(messageThreads.id, messageData.threadId));

    // TODO: Send push notification to recipient

    return newMessage[0];
  }

  async getMessageThreads(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Join through profiles to identify threads for this user and fetch the other participant
    const threads = await this.db.select({
      thread: messageThreads,
      agencyUser: users,
      talentUser: users,
    })
      .from(messageThreads)
      .leftJoin(agencyProfiles, eq(messageThreads.agencyId, agencyProfiles.id))
      .leftJoin(this.agencyUser, eq(this.agencyUser.id, agencyProfiles.userId))
      .leftJoin(talentProfiles, eq(messageThreads.talentId, talentProfiles.id))
      .leftJoin(this.talentUser, eq(this.talentUser.id, talentProfiles.userId))
      .where(
        or(
          eq(agencyProfiles.userId, userId as any),
          eq(talentProfiles.userId, userId as any)
        )
      )
      .orderBy(desc(messageThreads.lastMessageAt))
      .limit(limit)
      .offset(offset);

    return threads;
  }

  async getThreadMessages(userId: string, threadId: string, page = 1, limit = 50) {
    // Verify user has access to thread
    const thread = await this.db.select({ id: messageThreads.id, agencyId: messageThreads.agencyId, talentId: messageThreads.talentId, archivedByAgency: messageThreads.archivedByAgency, archivedByTalent: messageThreads.archivedByTalent })
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);

    if (!thread.length) {
      throw new NotFoundException('Message thread not found');
    }

    const threadData = thread[0];

    const userAgencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId })
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    const userTalentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    const isParticipant = (userAgencyProfile[0]?.id === threadData.agencyId) || (userTalentProfile[0]?.id === threadData.talentId);
    if (!isParticipant) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    const offset = (page - 1) * limit;

    const threadMessages = await this.db.select({
      messageId: messages.id,
      content: messages.content,
      messageType: messages.messageType,
      attachments: messages.attachments,
      sentAt: messages.sentAt,
      senderId: users.id,
      senderRole: users.role,
      talentFirstName: talentProfiles.firstName,
      talentLastName: talentProfiles.lastName,
      talentDisplayName: talentProfiles.displayName,
      agencyCompanyName: agencyProfiles.companyName,
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
    const thread = await this.db.select({ id: messageThreads.id, agencyId: messageThreads.agencyId, talentId: messageThreads.talentId, archivedByAgency: messageThreads.archivedByAgency as any, archivedByTalent: messageThreads.archivedByTalent as any })
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);

    if (!thread.length) {
      return;
    }

    const threadData = thread[0];

    // Determine which side the user is on
    const userAgencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId })
      .from(agencyProfiles)
      .where(eq(agencyProfiles.userId, userId))
      .limit(1);

    const userTalentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId })
      .from(talentProfiles)
      .where(eq(talentProfiles.userId, userId))
      .limit(1);

    const updateData: any = { updatedAt: new Date() };
    if (userAgencyProfile.length > 0 && userAgencyProfile[0].id === threadData.agencyId) {
      updateData.agencyUnreadCount = 0;
      updateData.agencyLastReadAt = new Date();
    }
    if (userTalentProfile.length > 0 && userTalentProfile[0].id === threadData.talentId) {
      updateData.talentUnreadCount = 0;
      updateData.talentLastReadAt = new Date();
    }

    await this.db.update(messageThreads)
      .set(updateData)
      .where(eq(messageThreads.id, threadId));
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Sum unread counts for the user based on their profile side
    const agencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId }).from(agencyProfiles).where(eq(agencyProfiles.userId, userId)).limit(1);
    const talentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId }).from(talentProfiles).where(eq(talentProfiles.userId, userId)).limit(1);

    let totalUnread = 0;

    if (agencyProfile.length > 0) {
      const agencyThreads = await this.db.select({ id: messageThreads.id, agencyUnreadCount: messageThreads.agencyUnreadCount }).from(messageThreads).where(eq(messageThreads.agencyId, agencyProfile[0].id));
      totalUnread += agencyThreads.reduce((sum, t: any) => sum + (t.agencyUnreadCount ?? 0), 0);
    }
    if (talentProfile.length > 0) {
      const talentThreads = await this.db.select({ id: messageThreads.id, talentUnreadCount: messageThreads.talentUnreadCount }).from(messageThreads).where(eq(messageThreads.talentId, talentProfile[0].id));
      totalUnread += talentThreads.reduce((sum, t: any) => sum + (t.talentUnreadCount ?? 0), 0);
    }

    return totalUnread;
  }

  async deleteThread(userId: string, threadId: string) {
    // Verify thread exists and user has access
    const thread = await this.db.select({ id: messageThreads.id, agencyId: messageThreads.agencyId, talentId: messageThreads.talentId, archivedByAgency: messageThreads.archivedByAgency, archivedByTalent: messageThreads.archivedByTalent })
      .from(messageThreads)
      .where(eq(messageThreads.id, threadId))
      .limit(1);

    if (!thread.length) {
      throw new NotFoundException('Message thread not found');
    }

    const threadData = thread[0];

    // Determine side by profiles
    const userAgencyProfile = await this.db.select({ id: agencyProfiles.id, userId: agencyProfiles.userId }).from(agencyProfiles).where(eq(agencyProfiles.userId, userId)).limit(1);
    const userTalentProfile = await this.db.select({ id: talentProfiles.id, userId: talentProfiles.userId }).from(talentProfiles).where(eq(talentProfiles.userId, userId)).limit(1);

    const isAgencySide = userAgencyProfile.length > 0 && userAgencyProfile[0].id === threadData.agencyId;
    const isTalentSide = userTalentProfile.length > 0 && userTalentProfile[0].id === threadData.talentId;

    if (!isAgencySide && !isTalentSide) {
      throw new ForbiddenException('You do not have access to this thread');
    }

    // Soft delete -> archive for this side
    await this.db.update(messageThreads)
      .set({
        archivedByAgency: isAgencySide ? true : threadData.archivedByAgency,
        archivedByTalent: isTalentSide ? true : threadData.archivedByTalent,
        updatedAt: new Date(),
      })
      .where(eq(messageThreads.id, threadId));

    return { success: true, message: 'Thread deleted successfully' };
  }
}
