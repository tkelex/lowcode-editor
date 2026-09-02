import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { DataSourceModelsController } from './data-source-models.controller';
import { DataSourceModelsService } from './data-source-models.service';

@Module({
  imports: [AuditLogsModule, ProjectsModule],
  controllers: [DataSourceModelsController],
  providers: [DataSourceModelsService],
  exports: [DataSourceModelsService],
})
export class DataSourceModelsModule {}
