import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectAssetsController, PublicAssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  imports: [ProjectsModule, AuditLogsModule],
  controllers: [ProjectAssetsController, PublicAssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
