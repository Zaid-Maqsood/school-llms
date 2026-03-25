const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, created, badRequest, notFound, conflict, serverError } = require('../../utils/response');
const { exportPayrollCSV } = require('../../services/payrollExportService');

// GET /api/admin/teacher-hours/export/csv (must be before /:id route)
router.get('/export/csv', async (req, res) => {
  try {
    const { teacher_id, date_from, date_to } = req.query;
    const filters = {};
    if (teacher_id) filters.teacherId = teacher_id;
    if (date_from) filters.dateFrom = date_from;
    if (date_to) filters.dateTo = date_to;

    const { csv, rowCount } = await exportPayrollCSV(filters, req.user.id);

    const filename = `teacher_hours_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/admin/teacher-hours
router.get('/', async (req, res) => {
  try {
    const { teacher_id, date_from, date_to } = req.query;
    let sql = `
      SELECT th.*, u.first_name, u.last_name, u.email,
             a.first_name AS admin_first_name, a.last_name AS admin_last_name
      FROM teacher_hours th
      JOIN users u ON u.id = th.teacher_user_id
      JOIN users a ON a.id = th.created_by_admin_user_id
      WHERE 1=1
    `;
    const params = []; let idx = 1;
    if (teacher_id) { sql += ` AND th.teacher_user_id = $${idx++}`; params.push(teacher_id); }
    if (date_from) { sql += ` AND th.work_date >= $${idx++}`; params.push(date_from); }
    if (date_to) { sql += ` AND th.work_date <= $${idx++}`; params.push(date_to); }
    sql += ' ORDER BY th.work_date DESC, u.last_name';

    const result = await query(sql, params);
    return ok(res, { hours: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/teacher-hours
router.post('/', async (req, res) => {
  try {
    const { teacher_user_id, work_date, hours_worked, notes } = req.body;
    if (!teacher_user_id || !work_date || hours_worked === undefined) {
      return badRequest(res, 'teacher_user_id, work_date, and hours_worked are required');
    }

    const h = parseFloat(hours_worked);
    if (isNaN(h) || h < 0 || h > 24) return badRequest(res, 'hours_worked must be between 0 and 24');

    const teacherExists = await query(`SELECT id FROM users WHERE id = $1 AND role = 'teacher'`, [teacher_user_id]);
    if (!teacherExists.rows.length) return notFound(res, 'Teacher not found');

    // Check for existing entry on same day
    const existing = await query(
      'SELECT id FROM teacher_hours WHERE teacher_user_id = $1 AND work_date = $2',
      [teacher_user_id, work_date]
    );
    if (existing.rows.length) {
      return conflict(res, 'Hours already logged for this teacher on this date. Use PUT to update.');
    }

    const result = await query(
      `INSERT INTO teacher_hours (teacher_user_id, work_date, hours_worked, notes, created_by_admin_user_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [teacher_user_id, work_date, h, notes?.trim() || null, req.user.id]
    );
    return created(res, { hours: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/admin/teacher-hours/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hours_worked, notes, work_date } = req.body;

    const existing = await query('SELECT id FROM teacher_hours WHERE id = $1', [id]);
    if (!existing.rows.length) return notFound(res, 'Hours record not found');

    const updates = []; const params = []; let idx = 1;
    if (hours_worked !== undefined) {
      const h = parseFloat(hours_worked);
      if (isNaN(h) || h < 0 || h > 24) return badRequest(res, 'hours_worked must be between 0 and 24');
      updates.push(`hours_worked = $${idx++}`); params.push(h);
    }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); params.push(notes?.trim() || null); }
    if (work_date !== undefined) { updates.push(`work_date = $${idx++}`); params.push(work_date); }
    if (!updates.length) return badRequest(res, 'No fields to update');

    params.push(id);
    const result = await query(`UPDATE teacher_hours SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return ok(res, { hours: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// DELETE /api/admin/teacher-hours/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM teacher_hours WHERE id = $1', [id]);
    if (!existing.rows.length) return notFound(res, 'Hours record not found');
    await query('DELETE FROM teacher_hours WHERE id = $1', [id]);
    return ok(res, { message: 'Hours record deleted' });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
