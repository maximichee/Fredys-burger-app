import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrdersGateway } from './orders.gateway';

export enum OrderStatus {
  PENDING    = 'PENDING',
  CONFIRMED  = 'CONFIRMED',
  PREPARING  = 'PREPARING',
  READY      = 'READY',
  DELIVERING = 'DELIVERING',
  DELIVERED  = 'DELIVERED',
  CANCELLED  = 'CANCELLED',
}

class OrderItemDto {
  @IsString() productId: string;
  @IsString() productName: string;
  @IsString() priceLabel: string;
  @IsNumber() unitPrice: number;
  @IsNumber() quantity: number;
  @IsString() @IsOptional() comment?: string;
}

export class CreateOrderDto {
  @IsString() deliveryMethod: string;
  @IsString() paymentMethod: string;
  @IsString() customerName: string;
  @IsString() customerPhone: string;
  @IsString() @IsOptional() address?: string;
  @IsString() @IsOptional() zone?: string;
  @IsNumber() deliveryCost: number;
  @IsString() @IsOptional() notes?: string;
  @IsArray() @Type(() => OrderItemDto) items: OrderItemDto[];
}

const INCLUDE = { items: true } as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
  ) {}

  findAll(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : {},
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.order.findUniqueOrThrow({ where: { id }, include: INCLUDE });
  }

  async create(dto: CreateOrderDto) {
    const { items, ...rest } = dto;
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const total    = subtotal + rest.deliveryCost;
    const code     = `PED${Date.now()}`;

    const order = await this.prisma.order.create({
      data: {
        ...rest,
        code,
        subtotal,
        total,
        status: OrderStatus.PENDING,
        items: {
          create: items.map((i) => ({ ...i, subtotal: i.unitPrice * i.quantity })),
        },
      },
      include: INCLUDE,
    });

    // Emitir a todos los admins conectados por WebSocket
    this.gateway.emitNewOrder(order);
    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: INCLUDE,
    });
    this.gateway.emitOrderUpdated(order);
    return order;
  }
}
