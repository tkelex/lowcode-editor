import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './modules/admin/admin.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { DataSourceModelsModule } from './modules/data-source-models/data-source-models.module';
import { HealthModule } from './modules/health/health.module';
import { PagesModule } from './modules/pages/pages.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    PagesModule,
    DataSourceModelsModule,
    TemplatesModule,
    AssetsModule,
    AdminModule,
  ],
})
export class AppModule {}
