/**
 * Generic CSV exporter utility for CMP Connect
 *
 * @param {string} filename Name of the downloaded file (e.g. 'cmp-activities.csv')
 * @param {string[]} headers Column headers array
 * @param {Array<Array<string|number>>} rows Matrix of row values
 */
export function exportToCsv(filename, headers, rows) {
  if (!rows || !rows.length) return;

  const escapeCell = (val) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map((row) => row.map(escapeCell).join(','));

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
