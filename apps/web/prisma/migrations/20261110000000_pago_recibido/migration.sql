-- El local marca cuándo recibió el pago del pedido
ALTER TABLE "orders" ADD COLUMN "paidAt" TIMESTAMP(3);
