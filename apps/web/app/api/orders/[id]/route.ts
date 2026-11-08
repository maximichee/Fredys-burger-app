import { pedido } from '@/lib/server/pedidos';
import { soloAdmin } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  soloAdmin(req, async () => pedido((await params).id));
