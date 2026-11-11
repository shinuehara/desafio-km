/** Agrupa as atividades válidas por dia e acumula o total (para o gráfico em degraus). */
export function cumulativeByDay(list: { activityDate: string; distanceM: number; invalidatedAt: Date | null }[]) {
  const byDay = new Map<string, number>();
  for (const a of list) {
    if (a.invalidatedAt) continue;
    byDay.set(a.activityDate, (byDay.get(a.activityDate) ?? 0) + a.distanceM);
  }
  let total = 0;
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayM]) => ({ date, dayM, totalM: (total += dayM) }));
}
