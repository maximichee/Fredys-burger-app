import { marcarPago } from '@/lib/server/pedidos';
import { soloAdmin, cuerpo } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/** PATCH { pagado: true | false } */
export const PATCH = (req: Request, { params }: { params: Promise<{ id: string }> }) =>
  soloAdmin(req, async () => {
    const { pagado } = await cuerpo<{ pagado?: boolean }>(req);
    return marcarPago((await params).id, pagado !== false);
  });
