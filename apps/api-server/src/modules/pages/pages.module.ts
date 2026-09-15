import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { ProjectsModule } from '../projects/projects.module';
import { RemoteMaterialsModule } from '../remote-materials/remote-materials.module';
import { PageLifecycleService } from './page-lifecycle.service';
import { PageMaterialSchemaService } from './page-material-schema.service';
import { PublishedPageRevalidateService } from './published-page-revalidate.service';
import { PagesController, PublicPagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [ProjectsModule, AuditLogsModule, RemoteMaterialsModule],
  controllers: [PagesController, PublicPagesController],
  providers: [PagesService, PageLifecycleService, PageMaterialSchemaService, PublishedPageRevalidateService],
  exports: [PageLifecycleService],
})
export class PagesModule {}
