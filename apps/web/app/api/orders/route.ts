import { crearPedido, pedidos } from '@/lib/server/pedidos';
import { responder, soloAdmin, cuerpo } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

// Público: el checkout manda el pedido
export const POST = (req: Request) => responder(async () => crearPedido(await cuerpo(req)));

// Admin: lista de pedidos (opcional ?status=PENDING)
export const GET = (req: Request) =>
  soloAdmin(req, () => pedidos(new URL(req.url).searchParams.get('status') ?? undefined));
