import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class PriceDto {
  @IsString() label: string;
  price: number;
  @IsOptional() order?: number;
}

export class CreateProductDto {
  @IsString() slug: string;
  @IsString() name: string;
  @IsString() @IsOptional() description?: string;
  @IsArray() @IsOptional() images?: string[];
  @IsString() categoryId: string;
  @IsArray() @Type(() => PriceDto) prices: PriceDto[];
  @IsBoolean() @IsOptional() featured?: boolean;
}

const INCLUDE = {
  category: true,
  prices: { orderBy: { order: 'asc' as const } },
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(categorySlug?: string) {
    return this.prisma.product.findMany({
      where: {
        available: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      include: INCLUDE,
      orderBy: { name: 'asc' },
    });
  }

  findOne(slug: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { slug },
      include: INCLUDE,
    });
  }

  async create(dto: CreateProductDto) {
    const { prices, ...rest } = dto;
    return this.prisma.product.create({
      data: {
        ...rest,
        images: rest.images ?? [],
        prices: {
          create: prices.map((p, i) => ({ ...p, order: p.order ?? i })),
        },
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: Partial<CreateProductDto> & { available?: boolean }) {
    const { prices, ...rest } = dto;
    if (prices) {
      await this.prisma.productPrice.deleteMany({ where: { productId: id } });
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(prices ? {
          prices: { create: prices.map((p, i) => ({ ...p, order: p.order ?? i })) },
        } : {}),
      },
      include: INCLUDE,
    });
  }

  remove(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { available: false },
    });
  }
}
