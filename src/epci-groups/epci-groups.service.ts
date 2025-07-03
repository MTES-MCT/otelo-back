import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '~/db/prisma.service';
import { TCreateEpciGroupDto, TUpdateEpciGroupDto, TEpciGroupWithEpcis } from '~/schemas/epci-group';

@Injectable()
export class EpciGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<TEpciGroupWithEpcis[]> {
    return this.prisma.epciGroup.findMany({
      where: { userId },
      include: {
        epciGroupEpcis: {
          include: {
            epci: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string): Promise<TEpciGroupWithEpcis> {
    const epciGroup = await this.prisma.epciGroup.findFirst({
      where: { id, userId },
      include: {
        epciGroupEpcis: {
          include: {
            epci: true,
          },
        },
      },
    });

    if (!epciGroup) {
      throw new NotFoundException('Groupe EPCI non trouvé');
    }

    return epciGroup;
  }

  async create(userId: string, data: TCreateEpciGroupDto): Promise<TEpciGroupWithEpcis> {
    const { name, epciCodes } = data;

    return this.prisma.epciGroup.create({
      data: {
        name,
        userId,
        epciGroupEpcis: {
          create: epciCodes.map((epciCode) => ({
            epciCode,
          })),
        },
      },
      include: {
        epciGroupEpcis: {
          include: {
            epci: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, data: TUpdateEpciGroupDto): Promise<TEpciGroupWithEpcis> {
    // Check if the group exists and belongs to the user
    const existingGroup = await this.prisma.epciGroup.findFirst({
      where: { id, userId },
    });

    if (!existingGroup) {
      throw new NotFoundException('Groupe EPCI non trouvé');
    }

    const { name, epciCodes } = data;

    // If epciCodes is provided, we need to update the relations
    if (epciCodes) {
      // Delete existing relations and create new ones
      await this.prisma.epciGroupEpcis.deleteMany({
        where: { epciGroupId: id },
      });

      return this.prisma.epciGroup.update({
        where: { id },
        data: {
          ...(name && { name }),
          epciGroupEpcis: {
            create: epciCodes.map((epciCode) => ({
              epciCode,
            })),
          },
        },
        include: {
          epciGroupEpcis: {
            include: {
              epci: true,
            },
          },
        },
      });
    }

    // If only name is being updated
    return this.prisma.epciGroup.update({
      where: { id },
      data: {
        ...(name && { name }),
      },
      include: {
        epciGroupEpcis: {
          include: {
            epci: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    // Check if the group exists and belongs to the user
    const existingGroup = await this.prisma.epciGroup.findFirst({
      where: { id, userId },
    });

    if (!existingGroup) {
      throw new NotFoundException('Groupe EPCI non trouvé');
    }

    // The cascade delete will handle removing epciGroupEpcis relations
    await this.prisma.epciGroup.delete({
      where: { id },
    });
  }
}
