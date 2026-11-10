-- Códigos de descuento
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minTotal" INTEGER,
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- Pedidos: qué código usaron y cuánto se descontó
ALTER TABLE "orders" ADD COLUMN "discountCode" TEXT;
ALTER TABLE "orders" ADD COLUMN "discount" INTEGER NOT NULL DEFAULT 0;
