/** Export PDF natif avec en-tête Djassa Online, date, totaux FCFA et pagination. */
export async function exportAdminPdf(title, columns, rows, { totalFmt } = {}) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableMod.default;
  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' });

  doc.setFillColor(120, 0, 0);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Djassa Online', 14, 12);
  doc.setFontSize(9);
  doc.text('Super Dashboard Admin — ' + title, 14, 19);
  doc.setTextColor(18, 18, 18);
  doc.setFontSize(9);
  doc.text('Export du ' + new Date().toLocaleString('fr-FR'), 14, 34);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [120, 0, 0], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { bottom: 20 },
  });

  if (totalFmt) {
    const finalY = doc.lastAutoTable?.finalY ?? 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(totalFmt, 14, finalY + 8);
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} / ${pages}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 8);
  }

  doc.save(`djassa-${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
