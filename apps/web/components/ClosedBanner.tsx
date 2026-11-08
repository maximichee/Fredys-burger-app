'use client';
import { waLink } from '@/lib/utils';
import { useEstadoLocal } from '@/lib/use-estado-local';

/** Franja cuando el local está cerrado: el menú se sigue pudiendo mirar.
 *  Cuenta regresiva en vivo ("Abrimos en 2 h 15 min"), con la hora de Argentina. */
export function ClosedBanner() {
  const estado = useEstadoLocal();

  if (!estado || estado.abierto) return null;
  return (
    <div className="-mt-3.5 mb-2 bg-choco/95 px-4 py-2 text-center text-sm" role="status">
      <span className="font-semibold">Estamos cerrados.</span> <span className="text-apagado">{estado.corto}.</span>{' '}
      <a href={waLink("Hola Fredy's, quiero dejar un pedido para cuando abran.")} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline underline-offset-4">
        Avisanos por WhatsApp
      </a>
    </div>
  );
}
