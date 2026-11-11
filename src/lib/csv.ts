/** Planilha CSV que abre certo no Excel em português (";" e BOM). */
export function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  // Evita que o Excel interprete o texto como fórmula.
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvResponse(rows: unknown[][], filename: string): Response {
  const csv = "﻿" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
