-- Pedido para más tarde: hora a la que el cliente lo retira o lo recibe
ALTER TABLE "orders" ADD COLUMN "scheduledFor" TIMESTAMP(3);
