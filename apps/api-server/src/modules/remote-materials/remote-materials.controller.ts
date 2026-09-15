import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { InstallRemoteMaterialDto } from './dto/install-remote-material.dto';
import { UpdateRemoteMaterialStatusDto } from './dto/update-remote-material-status.dto';
import { RemoteMaterialsService } from './remote-materials.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class RemoteMaterialsController {
  constructor(private readonly remoteMaterialsService: RemoteMaterialsService) {}

  @Get('projects/:projectId/remote-materials')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.remoteMaterialsService.list(projectId, user.userId);
  }

  @Post('projects/:projectId/remote-materials')
  install(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: InstallRemoteMaterialDto,
  ) {
    return this.remoteMaterialsService.install(projectId, user.userId, dto);
  }

  @Patch('remote-materials/:id')
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRemoteMaterialStatusDto,
  ) {
    return this.remoteMaterialsService.updateStatus(id, user.userId, dto);
  }

  @Delete('remote-materials/:id')
  delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.remoteMaterialsService.delete(id, user.userId);
  }
}
