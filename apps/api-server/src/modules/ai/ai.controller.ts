import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { CreateAiAgentRunDto } from './dto/create-ai-agent-run.dto';
import { ConfirmAiAgentRunDto, RejectAiAgentRunDto } from './dto/decide-ai-agent-run.dto';
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
  @HttpCode(202)
  createAgentRunForProject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateAiAgentRunDto,
  ) {
    return this.aiService.createAgentRunForProject(projectId, user.userId, dto);
  }

  @Post('pages/:pageId/ai/agent-runs')
  @HttpCode(202)
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

  @Get('pages/:pageId/ai/agent-runs')
  listPageRuns(@CurrentUser() user: CurrentUserPayload, @Param('pageId', ParseIntPipe) pageId: number) {
    return this.aiService.listAgentRunsForPage(pageId, user.userId);
  }

  @Get('projects/:projectId/ai/agent-runs')
  listProjectRuns(@CurrentUser() user: CurrentUserPayload, @Param('projectId', ParseIntPipe) projectId: number) {
    return this.aiService.listAgentRunsForProject(projectId, user.userId);
  }

  @Post('ai/agent-runs/:runId/cancel')
  cancelAgentRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
  ) {
    return this.aiService.cancelAgentRun(runId, user.userId);
  }

  @Post('ai/agent-runs/:runId/confirm')
  confirmAgentRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
    @Body() dto: ConfirmAiAgentRunDto,
  ) {
    return this.aiService.confirmAgentRun(runId, user.userId, dto.candidateId);
  }

  @Post('ai/agent-runs/:runId/reject')
  rejectAgentRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('runId') runId: string,
    @Body() dto: RejectAiAgentRunDto,
  ) {
    return this.aiService.rejectAgentRun(runId, user.userId, dto.candidateId, dto.reason);
  }
}
