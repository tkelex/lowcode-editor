import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list(ownerId: number) {
    return this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(ownerId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        ownerId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async getOwnedProject(id: number, ownerId: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId !== ownerId) {
      throw new ForbiddenException('No permission to access project');
    }

    return project;
  }

  async get(id: number, ownerId: number) {
    return this.getOwnedProject(id, ownerId);
  }

  async update(id: number, ownerId: number, dto: UpdateProjectDto) {
    await this.getOwnedProject(id, ownerId);

    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: number, ownerId: number) {
    await this.getOwnedProject(id, ownerId);
    await this.prisma.project.delete({ where: { id } });
    return { success: true };
  }
}
