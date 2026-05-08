import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { PagePublishService } from './page-publish.service';
import { PageSchemaService } from './page-schema.service';
import { PageVersionsService } from './page-versions.service';
import { PagesController, PublicPagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [ProjectsModule, AuditLogsModule],
  controllers: [PagesController, PublicPagesController],
  providers: [PagesService, PageSchemaService, PageVersionsService, PagePublishService],
})
export class PagesModule {}
