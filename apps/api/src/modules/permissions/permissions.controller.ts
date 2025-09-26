import { 
  Controller, 
  Post, 
  Get, 
  Patch,
  Body, 
  Param, 
  UseGuards, 
  Request,
  Ip,
  Headers,
  ForbiddenException 
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PermissionsService } from './permissions.service';

export class RequestContactPermissionDto {
  talentId: string;
  applicationId: string;
  requestContext?: string;
  requestMessage?: string;
}

export class GrantPermissionDto {
  permissionId: string;
}

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  /**
   * Agency requests permission to contact a talent
   */
  @Post('contact/request')
  @UseGuards(RolesGuard)
  @Roles('AGENCY')
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } }) // 10 requests per hour per agency
  async requestContactPermission(
    @Body() dto: RequestContactPermissionDto,
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.permissionsService.requestContactPermission({
      talentId: dto.talentId,
      agencyId: req.user.id,
      applicationId: dto.applicationId,
      requestContext: dto.requestContext,
      requestMessage: dto.requestMessage,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Talent grants permission to an agency
   */
  @Patch('contact/grant')
  @UseGuards(RolesGuard)
  @Roles('TALENT')
  async grantContactPermission(
    @Body() dto: GrantPermissionDto,
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.permissionsService.grantContactPermission({
      permissionId: dto.permissionId,
      talentId: req.user.id,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Talent revokes permission from an agency
   */
  @Patch('contact/revoke/:permissionId')
  @UseGuards(RolesGuard)
  @Roles('TALENT')
  async revokeContactPermission(
    @Param('permissionId') permissionId: string,
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.permissionsService.revokeContactPermission(
      permissionId,
      req.user.id,
      ipAddress,
      userAgent
    );
  }

  /**
   * Check if agency has permission to contact a talent
   */
  @Get('contact/check/:talentId')
  @UseGuards(RolesGuard)
  @Roles('AGENCY')
  async checkContactPermission(
    @Param('talentId') talentId: string,
    @Request() req,
  ) {
    const hasPermission = await this.permissionsService.hasContactPermission(
      talentId,
      req.user.id
    );
    return { hasPermission };
  }

  /**
   * Get all permissions for the current talent
   */
  @Get('contact/talent')
  @UseGuards(RolesGuard)
  @Roles('TALENT')
  async getTalentPermissions(@Request() req) {
    return this.permissionsService.getTalentPermissions(req.user.id);
  }

  /**
   * Get all permission requests made by the current agency
   */
  @Get('contact/agency')
  @UseGuards(RolesGuard)
  @Roles('AGENCY')
  async getAgencyPermissions(@Request() req) {
    return this.permissionsService.getAgencyPermissions(req.user.id);
  }

  /**
   * Get contact information for a talent (only if permission granted)
   */
  @Get('contact/:talentId')
  @UseGuards(RolesGuard)
  @Roles('AGENCY')
  @Throttle({ default: { limit: 50, ttl: 60 * 60 * 1000 } }) // 50 contact info requests per hour
  async getTalentContactInfo(
    @Param('talentId') talentId: string,
    @Request() req,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    const hasPermission = await this.permissionsService.hasContactPermission(
      talentId,
      req.user.id
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this talent\'s contact information'
      );
    }

    // TODO: Implement actual contact info retrieval from users service
    // For now, return a placeholder
    return {
      talentId,
      message: 'Contact information would be provided here',
      // email: talent.email,
      // phone: talent.phone,
    };
  }
}
