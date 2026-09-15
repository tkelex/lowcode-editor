import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { RemoteMaterialsController } from './remote-materials.controller';
import { RemoteMaterialsService } from './remote-materials.service';

@Module({
  imports: [AuditLogsModule, ProjectsModule],
  controllers: [RemoteMaterialsController],
  providers: [RemoteMaterialsService],
  exports: [RemoteMaterialsService],
})
export class RemoteMaterialsModule {}
