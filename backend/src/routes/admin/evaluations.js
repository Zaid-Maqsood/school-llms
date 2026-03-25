const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, serverError } = require('../../utils/response');

// GET /api/admin/evaluations — admin can view all
router.get('/', async (req, res) => {
  try {
    const { student_id, teacher_id, subject_id, date_from, date_to } = req.query;
    let sql = `
      SELECT e.*, st.first_name || ' ' || st.last_name AS student_name,
             u.first_name || ' ' || u.last_name AS teacher_name,
             s.name AS subject_name
      FROM evaluations e
      JOIN students st ON st.id = e.student_id
      JOIN users u ON u.id = e.teacher_user_id
      JOIN subjects s ON s.id = e.subject_id
      WHERE 1=1
    `;
    const params = []; let idx = 1;
    if (student_id) { sql += ` AND e.student_id = $${idx++}`; params.push(student_id); }
    if (teacher_id) { sql += ` AND e.teacher_user_id = $${idx++}`; params.push(teacher_id); }
    if (subject_id) { sql += ` AND e.subject_id = $${idx++}`; params.push(subject_id); }
    if (date_from) { sql += ` AND e.evaluation_date >= $${idx++}`; params.push(date_from); }
    if (date_to) { sql += ` AND e.evaluation_date <= $${idx++}`; params.push(date_to); }
    sql += ' ORDER BY e.evaluation_date DESC, e.created_at DESC LIMIT 200';

    const result = await query(sql, params);
    return ok(res, { evaluations: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/admin/export-logs
router.get('/export-logs', async (req, res) => {
  try {
    const result = await query(
      `SELECT el.*, u.first_name || ' ' || u.last_name AS exported_by_name
       FROM export_logs el JOIN users u ON u.id = el.exported_by_user_id
       ORDER BY el.exported_at DESC LIMIT 100`
    );
    return ok(res, { logs: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    const [usersRes, studentsRes, evalsRes, hoursRes] = await Promise.all([
      query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
      query(`SELECT status, COUNT(*) as count FROM students GROUP BY status`),
      query(`SELECT COUNT(*) as count FROM evaluations WHERE evaluation_date >= NOW() - INTERVAL '30 days'`),
      query(`SELECT SUM(hours_worked) as total FROM teacher_hours WHERE work_date >= NOW() - INTERVAL '30 days'`),
    ]);

    const users = {};
    usersRes.rows.forEach((r) => { users[r.role] = parseInt(r.count); });
    const students = {};
    studentsRes.rows.forEach((r) => { students[r.status] = parseInt(r.count); });

    return ok(res, {
      users,
      students,
      evaluations_last_30_days: parseInt(evalsRes.rows[0].count),
      teacher_hours_last_30_days: parseFloat(hoursRes.rows[0].total || 0),
    });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
