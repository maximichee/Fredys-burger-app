import { codigos, crearCodigo } from '@/lib/server/descuentos';
import { soloAdmin, cuerpo } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) => soloAdmin(req, codigos);

export const POST = (req: Request) => soloAdmin(req, async () => crearCodigo(await cuerpo(req)));
