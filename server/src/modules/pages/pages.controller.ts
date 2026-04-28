import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('projects/:projectId/pages')
  list(@CurrentUser() user: CurrentUserPayload, @Param('projectId', ParseIntPipe) projectId: number) {
    return this.pagesService.list(projectId, user.userId);
  }

  @Post('projects/:projectId/pages')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreatePageDto,
  ) {
    return this.pagesService.create(projectId, user.userId, dto);
  }

  @Get('pages/:id')
  get(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.pagesService.get(id, user.userId);
  }

  @Patch('pages/:id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pagesService.update(id, user.userId, dto);
  }

  @Delete('pages/:id')
  delete(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.pagesService.delete(id, user.userId);
  }
}
