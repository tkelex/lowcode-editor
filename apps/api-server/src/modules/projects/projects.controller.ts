import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.projectsService.list(user.userId);
  }

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.userId, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.get(id, user.userId);
  }

  @Get(':id/members')
  listMembers(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.listMembers(id, user.userId);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectsService.addMember(id, user.userId, dto);
  }

  @Patch(':id/members/:memberId')
  updateMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    return this.projectsService.updateMember(id, memberId, user.userId, dto);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.projectsService.removeMember(id, memberId, user.userId);
  }

  @Get(':id/audit-logs')
  listAuditLogs(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.listAuditLogs(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.userId, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.projectsService.delete(id, user.userId);
  }
}
