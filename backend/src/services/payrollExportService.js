/**
 * Payroll Export Service
 * V1: CSV export compatible with Google Sheets.
 * Future: Add STORAGE_PROVIDER=google_sheets and implement Sheets API push here.
 */
const { stringify } = require('csv-stringify');
const { query } = require('../config/db');

const CSV_COLUMNS = [
  { key: 'teacher_full_name', header: 'Teacher Full Name' },
  { key: 'teacher_email', header: 'Teacher Email' },
  { key: 'work_date', header: 'Date' },
  { key: 'hours_worked', header: 'Hours Worked' },
  { key: 'notes', header: 'Notes' },
  { key: 'created_at', header: 'Created At' },
  { key: 'updated_at', header: 'Updated At' },
];

async function fetchHoursData(filters = {}) {
  let sql = `
    SELECT
      u.first_name || ' ' || u.last_name AS teacher_full_name,
      u.email AS teacher_email,
      th.work_date,
      th.hours_worked,
      COALESCE(th.notes, '') AS notes,
      th.created_at,
      th.updated_at
    FROM teacher_hours th
    JOIN users u ON u.id = th.teacher_user_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (filters.teacherId) {
    sql += ` AND th.teacher_user_id = $${idx++}`;
    params.push(filters.teacherId);
  }
  if (filters.dateFrom) {
    sql += ` AND th.work_date >= $${idx++}`;
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    sql += ` AND th.work_date <= $${idx++}`;
    params.push(filters.dateTo);
  }

  sql += ' ORDER BY th.work_date DESC, teacher_full_name ASC';

  const result = await query(sql, params);
  return result.rows;
}

function generateCSV(rows) {
  return new Promise((resolve, reject) => {
    const headers = CSV_COLUMNS.map((c) => c.header);
    const data = rows.map((row) => {
      return CSV_COLUMNS.map((col) => {
        const val = row[col.key];
        if (val instanceof Date) return val.toISOString().split('T')[0];
        if (typeof val === 'object' && val !== null) return val.toISOString ? val.toISOString() : JSON.stringify(val);
        return val ?? '';
      });
    });

    stringify([headers, ...data], (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
}

async function exportPayrollCSV(filters, exportedByUserId) {
  const rows = await fetchHoursData(filters);
  const csv = await generateCSV(rows);

  // Log the export
  await query(
    `INSERT INTO export_logs (export_type, date_from, date_to, row_count, exported_by_user_id)
     VALUES ($1, $2, $3, $4, $5)`,
    ['teacher_hours_csv', filters.dateFrom || null, filters.dateTo || null, rows.length, exportedByUserId]
  );

  return { csv, rowCount: rows.length };
}

module.exports = { exportPayrollCSV, fetchHoursData };
