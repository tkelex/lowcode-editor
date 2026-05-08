import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AssetsService } from './assets.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/assets')
export class ProjectAssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Param('projectId', ParseIntPipe) projectId: number) {
    return this.assetsService.list(projectId, user.userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.assetsService.upload(projectId, user.userId, file);
  }

  @Delete(':assetId')
  delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('assetId', ParseIntPipe) assetId: number,
  ) {
    return this.assetsService.delete(projectId, assetId, user.userId);
  }
}

@Controller('assets')
export class PublicAssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get(':projectId/:filename')
  async read(
    @Param('projectId') projectId: string,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { file, asset } = await this.assetsService.read(`${projectId}/${filename}`);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.setHeader('Content-Type', asset.mimeType);
    return file;
  }
}
