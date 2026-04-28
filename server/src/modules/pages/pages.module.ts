import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [ProjectsModule],
  controllers: [PagesController],
  providers: [PagesService],
})
export class PagesModule {}
