import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit/audit-logs.module';
import { PagesModule } from '../pages/pages.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [AuditLogsModule, PagesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
