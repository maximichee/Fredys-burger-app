import { cambiarEstado } from '@/lib/server/pedidos';
import { soloAdmin, cuerpo } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  soloAdmin(req, async () => {
    const { status } = await cuerpo<{ status?: string }>(req);
    return cambiarEstado((await params).id, String(status));
  });
