import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { CreateAiAgentRunDto } from './dto/create-ai-agent-run.dto';
import { GenerateAiPageDto } from './dto/generate-ai-page.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('projects/:projectId/ai/page-generation')
  generateForProject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: GenerateAiPageDto,
  ) {
    return this.aiService.generateForProject(projectId, user.userId, dto);
  }

  @Post('pages/:pageId/ai/page-generation')
  generateForPage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: GenerateAiPageDto,
  ) {
    return this.aiService.generateForPage(pageId, user.userId, dto);
  }

  @Post('projects/:projectId/ai/agent-runs')
  createAgentRunForProject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateAiAgentRunDto,
  ) {
    return this.aiService.createAgentRunForProject(projectId, user.userId, dto);
  }

  @Post('pages/:pageId/ai/agent-runs')
  createAgentRunForPage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: CreateAiAgentRunDto,
  ) {
    return this.aiService.createAgentRunForPage(pageId, user.userId, dto);
  }

  @Get('ai/agent-runs/:runId')
  getAgentRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
  ) {
    return this.aiService.getAgentRun(runId, user.userId);
  }

  @Post('ai/agent-runs/:runId/cancel')
  cancelAgentRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
  ) {
    return this.aiService.cancelAgentRun(runId, user.userId);
  }
}
