import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, user.userId, dto.status);
  }

  @Get('projects')
  projects() {
    return this.adminService.listProjects();
  }

  @Patch('projects/:id/status')
  updateProjectStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.adminService.updateProjectStatus(id, user.userId, dto.status);
  }

  @Get('published-pages')
  publishedPages() {
    return this.adminService.listPublishedPages();
  }

  @Post('pages/:id/unpublish')
  unpublishPage(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.unpublishPage(id, user.userId);
  }

  @Get('audit-logs')
  auditLogs() {
    return this.adminService.listAuditLogs();
  }
}
