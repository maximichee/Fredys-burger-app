export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

export function isOpen(): boolean {
  const now  = new Date();
  const day  = now.getDay(); // 0=Dom, 1=Lun, 6=Sab
  const mins = now.getHours() * 60 + now.getMinutes();
  return [0, 2, 3, 4, 5, 6].includes(day) && mins >= 19 * 60 + 30 && mins < 23 * 60 + 30;
}

export function nextOpeningMsg(): string {
  const now     = new Date();
  const day     = now.getDay();
  const mins    = now.getHours() * 60 + now.getMinutes();
  const names   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const openDays = [0, 2, 3, 4, 5, 6];

  if (openDays.includes(day) && mins < 19 * 60 + 30)
    return 'Hoy abrimos a las 19:30hs';

  let next = (day + 1) % 7, ahead = 1;
  while (!openDays.includes(next)) { next = (next + 1) % 7; ahead++; }

  return ahead === 1
    ? `Mañana (${names[next]}) abrimos a las 19:30hs`
    : `Próxima apertura: ${names[next]} a las 19:30hs`;
}

export const DELIVERY_COSTS: Record<string, number> = {
  retiro: 0,
  '1km':  2000,
  '3km':  2500,
  '4km':  3500,
  '6km':  4500,
};
