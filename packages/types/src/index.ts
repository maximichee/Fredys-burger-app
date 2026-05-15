// ─── Categorías ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  slug: string;
  name: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  products?: Product[];
}

export interface CreateCategoryDto {
  slug: string;
  name: string;
  order?: number;
}

// ─── Productos ────────────────────────────────────────────────────────────────

export interface ProductPrice {
  id: string;
  label: string;      // "simple", "doble", "triple", "unico", "promo"
  price: number;
  order: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  categoryId: string;
  category?: Category;
  prices: ProductPrice[];
  available: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  slug: string;
  name: string;
  description?: string;
  images?: string[];
  categoryId: string;
  prices: { label: string; price: number; order?: number }[];
  featured?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  available?: boolean;
}

// ─── Carrito ──────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productSlug: string;
  name: string;
  image: string;
  priceLabel: string;
  price: number;
  quantity: number;
  comment?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryMethod = 'PICKUP' | 'DELIVERY';
export type PaymentMethod  = 'CASH'   | 'TRANSFER';

export const DELIVERY_COSTS: Record<string, number> = {
  retiro: 0,
  '1km':  2000,
  '3km':  2500,
  '4km':  3500,
  '6km':  4500,
};

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  priceLabel: string;
  unitPrice: number;
  quantity: number;
  comment?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  address?: string;
  zone?: string;
  deliveryCost: number;
  subtotal: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDto {
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  address?: string;
  zone?: string;
  deliveryCost: number;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    priceLabel: string;
    unitPrice: number;
    quantity: number;
    comment?: string;
  }[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  admin: { id: string; email: string; name: string };
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
