import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DataSourceModelsService } from './data-source-models.service';
import { CreateDataSourceModelDto } from './dto/create-data-source-model.dto';
import { UpdateDataSourceModelDto } from './dto/update-data-source-model.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class DataSourceModelsController {
  constructor(private readonly dataSourceModelsService: DataSourceModelsService) {}

  @Get('projects/:projectId/data-source-models')
  list(@CurrentUser() user: CurrentUserPayload, @Param('projectId', ParseIntPipe) projectId: number) {
    return this.dataSourceModelsService.list(projectId, user.userId);
  }

  @Post('projects/:projectId/data-source-models')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateDataSourceModelDto,
  ) {
    return this.dataSourceModelsService.create(projectId, user.userId, dto);
  }

  @Get('data-source-models/:id')
  get(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.dataSourceModelsService.get(id, user.userId);
  }

  @Patch('data-source-models/:id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDataSourceModelDto,
  ) {
    return this.dataSourceModelsService.update(id, user.userId, dto);
  }

  @Delete('data-source-models/:id')
  delete(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseIntPipe) id: number) {
    return this.dataSourceModelsService.delete(id, user.userId);
  }
}
