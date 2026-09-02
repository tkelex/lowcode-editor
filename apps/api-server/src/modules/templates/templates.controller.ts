import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateTemplateDto } from './dto/create-template.dto';
import { TemplatesService } from './templates.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Param('projectId', ParseIntPipe) projectId: number) {
    return this.templatesService.list(projectId, user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(projectId, user.userId, dto);
  }

  @Delete(':templateId')
  delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    return this.templatesService.delete(projectId, templateId, user.userId);
  }
}
