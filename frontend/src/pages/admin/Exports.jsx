import React, { useState, useEffect } from 'react';
import { exportTeacherHoursCSV, getExportLogs, getUsers } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function AdminExports() {
  const [teachers, setTeachers] = useState([]);
  const [filters, setFilters] = useState({ teacher_id: '', date_from: '', date_to: '' });
  const [exporting, setExporting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getUsers({ role: 'teacher' }).then((r) => setTeachers(r.data.users)).catch(console.error);
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLogsLoading(true);
    try { const r = await getExportLogs(); setLogs(r.data.logs); }
    catch (e) { console.error(e); }
    setLogsLoading(false);
  };

  const handleExport = async () => {
    setExporting(true); setMessage('');
    try {
      const params = {};
      if (filters.teacher_id) params.teacher_id = filters.teacher_id;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const r = await exportTeacherHoursCSV(params);
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher_hours_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage('CSV exported successfully. Open in Google Sheets by importing the downloaded file.');
      loadLogs();
    } catch (e) {
      setMessage('Export failed: ' + (e.response?.data?.error || e.message));
    } finally { setExporting(false); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Exports</h1>

      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Teacher Hours Export</h2>
        <p className="text-sm text-gray-500 mb-4">
          Download a CSV file of teacher work hours. Open in Google Sheets via File → Import.
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${message.startsWith('Export failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="form-label">Teacher (optional)</label>
            <select className="form-select w-48" value={filters.teacher_id} onChange={(e) => setFilters((f) => ({ ...f, teacher_id: e.target.value }))}>
              <option value="">All Teachers</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input type="date" className="form-input w-36" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" className="form-input w-36" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
          </div>
        </div>

        <button onClick={handleExport} disabled={exporting} className="btn-primary">
          {exporting ? 'Generating...' : '⬇ Download CSV'}
        </button>

        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-500">
          <strong>CSV columns:</strong> Teacher Full Name, Teacher Email, Date, Hours Worked, Notes, Created At, Updated At
        </div>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Export History</h2>
        {logsLoading ? <LoadingSpinner /> : (
          logs.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Type', 'Date Range', 'Rows', 'Exported By', 'Exported At'].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="table-cell"><span className="badge-blue">{l.export_type}</span></td>
                      <td className="table-cell text-gray-500">{l.date_from || '–'} → {l.date_to || '–'}</td>
                      <td className="table-cell">{l.row_count}</td>
                      <td className="table-cell text-gray-500">{l.exported_by_name}</td>
                      <td className="table-cell text-gray-500 text-xs">{new Date(l.exported_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon="📤" title="No exports yet" description="Your export history will appear here." />
          )
        )}
      </div>
    </div>
  );
}
