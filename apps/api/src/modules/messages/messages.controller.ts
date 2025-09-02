import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { ContactPermissionsService } from './contact-permissions.service';
import { 
  CreateMessageThreadDto,
  SendMessageDto,
  CreateContactPermissionRequestDto,
  RespondToContactRequestDto
} from './dto/message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly contactPermissionsService: ContactPermissionsService,
  ) {}

  // Message Threads
  @Get('threads')
  async getMessageThreads(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.messagesService.getMessageThreads(
      req.user.id,
      parseInt(page),
      parseInt(limit)
    );
  }

  @Post('threads')
  @HttpCode(HttpStatus.CREATED)
  async createMessageThread(
    @Request() req,
    @Body() threadData: CreateMessageThreadDto
  ) {
    return this.messagesService.createMessageThread(req.user.id, threadData);
  }

  @Get('threads/:id')
  async getThreadMessages(
    @Param('id') id: string,
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ) {
    return this.messagesService.getThreadMessages(
      req.user.id,
      id,
      parseInt(page),
      parseInt(limit)
    );
  }

  @Put('threads/:id/read')
  @HttpCode(HttpStatus.OK)
  async markThreadAsRead(
    @Param('id') id: string,
    @Request() req
  ) {
    await this.messagesService.markThreadAsRead(req.user.id, id);
    return { success: true };
  }

  @Delete('threads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteThread(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.messagesService.deleteThread(req.user.id, id);
  }

  // Messages
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Request() req,
    @Body() messageData: SendMessageDto
  ) {
    return this.messagesService.sendMessage(req.user.id, messageData);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.messagesService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  // Contact Permissions
  @Post('contact-permissions')
  @HttpCode(HttpStatus.CREATED)
  async requestContactPermission(
    @Request() req,
    @Body() requestData: CreateContactPermissionRequestDto
  ) {
    return this.contactPermissionsService.requestContactPermission(
      req.user.id,
      requestData
    );
  }

  @Get('contact-permissions')
  async getContactPermissions(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.contactPermissionsService.getContactPermissions(
      req.user.id,
      req.user.role,
      parseInt(page),
      parseInt(limit)
    );
  }

  @Get('contact-permissions/:id')
  async getContactPermission(
    @Param('id') id: string,
    @Request() req
  ) {
    return this.contactPermissionsService.getContactPermission(id, req.user.id);
  }

  @Put('contact-permissions/:id/respond')
  async respondToContactRequest(
    @Param('id') id: string,
    @Body() responseData: RespondToContactRequestDto,
    @Request() req
  ) {
    return this.contactPermissionsService.respondToContactRequest(
      req.user.id,
      id,
      responseData
    );
  }

  @Get('contact-permissions/check/:agencyId/:talentId')
  async checkContactPermission(
    @Param('agencyId') agencyId: string,
    @Param('talentId') talentId: string
  ) {
    return this.contactPermissionsService.checkContactPermission(agencyId, talentId);
  }
}
