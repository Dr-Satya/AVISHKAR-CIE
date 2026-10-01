import * as XLSX from "xlsx";

export function exportToCsv(data: Record<string, any>[], filename: string) {
  if (!data || data.length === 0) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToXlsx(data: Record<string, any>[], filename: string, sheetName = "Data") {
  if (!data || data.length === 0) return;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPdf(data: Record<string, any>[], title: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: landscape; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 11px; }
    .header { border-bottom: 2px solid #0d2137; padding-bottom: 12px; margin-bottom: 16px; }
    .title { font-size: 18px; font-weight: bold; color: #0d2137; margin: 0; }
    .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #0d2137; color: #ffffff; text-align: left; padding: 6px 8px; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: right; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">G.D. GOENKA UNIVERSITY · IDP PORTAL</h1>
    <div class="meta">${title} · Generated on ${new Date().toLocaleString()} · Total Records: ${data.length}</div>
  </div>
  <table>
    <thead>
      <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) =>
            `<tr>${headers.map((h) => `<td>${row[h] !== undefined && row[h] !== null ? row[h] : ""}</td>`).join("")}</tr>`
        )
        .join("")}
    </tbody>
  </table>
  <div class="footer">Confidential · G.D. Goenka University Institutional Project Portal</div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 200);
    }
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

export async function downloadIdpCohortsXlsx(filter = "registered", school?: string): Promise<void> {
  const params = new URLSearchParams({
    scope: "IDP_COHORTS",
    format: "xlsx",
  });
  if (filter && filter !== "registered") params.set("filter", filter);
  if (school && school !== "all") params.set("school", school);

  const res = await fetch(`/api/export?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to download cohort details.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().split("T")[0];
  a.download = `IDP_Cohorts_Details_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

