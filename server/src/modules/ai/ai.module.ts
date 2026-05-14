import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { AiController } from './ai.controller';
import { AiAgentContextService } from './ai-agent-context.service';
import { AiAgentOrchestrationService } from './ai-agent-orchestration.service';
import { AiAgentToolRegistryService } from './ai-agent-tool-registry.service';
import { AiModelGatewayService } from './ai-model-gateway.service';
import { AiPageGeneratorService } from './ai-page-generator.service';
import { AiService } from './ai.service';

@Module({
  imports: [AuditLogsModule, ProjectsModule],
  controllers: [AiController],
  providers: [
    AiAgentContextService,
    AiAgentOrchestrationService,
    AiAgentToolRegistryService,
    AiModelGatewayService,
    AiPageGeneratorService,
    AiService,
  ],
})
export class AiModule {}
