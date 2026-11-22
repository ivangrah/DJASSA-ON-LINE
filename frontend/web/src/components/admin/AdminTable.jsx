import { Download } from 'lucide-react';
import { exportAdminPdf } from '../../lib/adminPdf';

/** Tableau admin générique avec bouton d'export PDF (lazy import). */
export default function AdminTable({ title, columns, rows, renderRow, totalLabel, onExportReady }) {
  const headers = columns.map((c) => c.label);
  const pdfRows = rows.map((r) => columns.map((c) => {
    const v = r[c.key];
    return v == null ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v);
  }));

  const handleExport = async () => {
    if (onExportReady) onExportReady();
    const totalFmt = totalLabel ? `Total : ${totalLabel}` : undefined;
    await exportAdminPdf(title, headers, pdfRows, { totalFmt });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-spacegrotesk text-[13px] font-extrabold text-djassa-black">{title} <span className="text-djassa-black/40">({rows.length})</span></p>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold text-white transition hover:bg-[#9b0000] active:scale-95"
        >
          <Download size={14} /> Exporter en PDF
        </button>
      </div>
      <div className="overflow-x-auto rounded-[5px] border-none bg-white shadow-card">
        <table className="w-full text-left font-DM-Sans text-[11px]">
          <thead>
            <tr className="bg-djassa-cloud">
              {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-2.5 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide text-djassa-black/60">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-djassa-black/45">Aucune donnée.</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id ?? i} className="border-t border-djassa-black/5 hover:bg-djassa-cloud/60">
                {renderRow
                  ? renderRow(r)
                  : columns.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-2.5">{String(r[c.key] ?? '—')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
