import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { PageLifecycleService } from './page-lifecycle.service';
import { PublishedPageRevalidateService } from './published-page-revalidate.service';
import { PagesController, PublicPagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [ProjectsModule, AuditLogsModule],
  controllers: [PagesController, PublicPagesController],
  providers: [PagesService, PageLifecycleService, PublishedPageRevalidateService],
  exports: [PageLifecycleService],
})
export class PagesModule {}
