import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService, CreateOrderDto, OrderStatus } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsEnum } from 'class-validator';

class UpdateStatusDto {
  @IsEnum(OrderStatus) status: OrderStatus;
}

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  // Público: crear pedido
  @Post()
  create(@Body() dto: CreateOrderDto) { return this.svc.create(dto); }

  // Admin: ver todos los pedidos
  @Get()
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  findAll(@Query('status') status?: OrderStatus) {
    return this.svc.findAll(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.svc.updateStatus(id, dto.status);
  }
}
