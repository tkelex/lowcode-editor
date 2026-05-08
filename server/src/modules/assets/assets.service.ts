import { createReadStream } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { isAbsolute, join, normalize, relative, resolve } from 'path';
import { HttpStatus, Injectable, StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectMemberRole } from '@prisma/client';
import { BusinessException } from '../../common/errors/business.exception';
import { AppErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit/audit-logs.service';
import {
  EDITABLE_PROJECT_ROLES,
  ProjectAccessService,
  READABLE_PROJECT_ROLES,
} from '../projects/project-access.service';

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'text/plain',
]);

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async list(projectId: number, userId: number) {
    await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);

    return this.prisma.asset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upload(projectId: number, userId: number, file: Express.Multer.File | undefined) {
    await this.projectAccessService.requireProjectRole(projectId, userId, EDITABLE_PROJECT_ROLES);

    if (!file) {
      throw new BusinessException(AppErrorCode.BAD_REQUEST, 'File is required', HttpStatus.BAD_REQUEST);
    }

    this.assertFileAllowed(file);

    const uploadRoot = this.getUploadRoot();
    const projectDir = join(uploadRoot, String(projectId));
    await mkdir(projectDir, { recursive: true });

    const extension = getSafeExtension(file.originalname);
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}${extension}`;
    const storageKey = `${projectId}/${filename}`;
    const targetPath = this.resolveStoragePath(storageKey);
    await writeFile(targetPath, file.buffer);

    const asset = await this.prisma.$transaction(async (tx) => {
      const createdAsset = await tx.asset.create({
        data: {
          projectId,
          uploadedById: userId,
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          storageKey,
          category: file.mimetype.startsWith('image/') ? 'image' : 'file',
          url: `/api/assets/${storageKey.replace(/\\/g, '/')}`,
        },
      });

      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId,
          action: 'asset.upload',
          targetType: 'asset',
          targetId: createdAsset.id,
          summary: `Upload asset ${createdAsset.originalName}`,
          metadata: {
            mimeType: createdAsset.mimeType,
            size: createdAsset.size,
            category: createdAsset.category,
          },
        },
        tx,
      );

      return createdAsset;
    });

    return asset;
  }

  async delete(projectId: number, assetId: number, userId: number) {
    const { role } = await this.projectAccessService.requireProjectRole(projectId, userId, READABLE_PROJECT_ROLES);
    const asset = await this.prisma.asset.findFirst({ where: { id: assetId, projectId } });

    if (!asset) {
      throw new BusinessException(AppErrorCode.NOT_FOUND, 'Asset not found', HttpStatus.NOT_FOUND);
    }

    const canDelete = role === ProjectMemberRole.OWNER || asset.uploadedById === userId;
    if (!canDelete) {
      throw new BusinessException(
        AppErrorCode.PROJECT_FORBIDDEN,
        'No permission to delete asset',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await this.auditLogsService.record(
        {
          actorId: userId,
          projectId,
          action: 'asset.delete',
          targetType: 'asset',
          targetId: asset.id,
          summary: `Delete asset ${asset.originalName}`,
          metadata: {
            mimeType: asset.mimeType,
            size: asset.size,
            category: asset.category,
          },
        },
        tx,
      );

      await tx.asset.delete({ where: { id: asset.id } });
    });

    await unlink(this.resolveStoragePath(asset.storageKey)).catch(() => undefined);

    return { success: true };
  }

  async read(storageKey: string) {
    const asset = await this.prisma.asset.findFirst({ where: { storageKey } });
    if (!asset) {
      throw new BusinessException(AppErrorCode.NOT_FOUND, 'Asset not found', HttpStatus.NOT_FOUND);
    }

    return {
      file: new StreamableFile(createReadStream(this.resolveStoragePath(storageKey)), {
        type: asset.mimeType,
        disposition: `inline; filename="${encodeURIComponent(asset.originalName)}"`,
      }),
      asset,
    };
  }

  private assertFileAllowed(file: Express.Multer.File) {
    const maxSize = Number(this.configService.get<string>('UPLOAD_MAX_SIZE') ?? DEFAULT_MAX_SIZE);

    if (file.size > maxSize) {
      throw new BusinessException(AppErrorCode.BAD_REQUEST, 'File is too large', HttpStatus.BAD_REQUEST);
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BusinessException(AppErrorCode.BAD_REQUEST, 'File type is not allowed', HttpStatus.BAD_REQUEST);
    }
  }

  private getUploadRoot() {
    const configuredUploadDir = this.configService.get<string>('UPLOAD_DIR') ?? join(process.cwd(), 'uploads');
    return normalize(isAbsolute(configuredUploadDir) ? configuredUploadDir : resolve(process.cwd(), configuredUploadDir));
  }

  private resolveStoragePath(storageKey: string) {
    const uploadRoot = this.getUploadRoot();
    const normalizedStorageKey = normalize(storageKey);
    const targetPath = normalize(resolve(uploadRoot, normalizedStorageKey));
    const relativePath = relative(uploadRoot, targetPath);

    if (isAbsolute(normalizedStorageKey) || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      throw new BusinessException(AppErrorCode.BAD_REQUEST, 'Invalid asset path', HttpStatus.BAD_REQUEST);
    }

    return targetPath;
  }
}

function getSafeExtension(filename: string) {
  const matched = filename.match(/\.[a-zA-Z0-9]+$/);
  return matched ? matched[0].toLowerCase() : '';
}
