const router = require('express').Router();
const path = require('path');
const { query } = require('../config/db');
const { getFileStream } = require('../services/storageService');
const { ok, notFound, forbidden, serverError } = require('../utils/response');

// GET /api/subjects — accessible to all authenticated users
router.get('/subjects', async (req, res) => {
  try {
    const result = await query(`SELECT * FROM subjects WHERE status = 'active' ORDER BY name`);
    return ok(res, { subjects: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/uploads/:attachmentId — permission-checked file serving
router.get('/uploads/:attachmentId', async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const attachRes = await query(
      `SELECT ea.*, e.student_id, e.teacher_user_id
       FROM evaluation_attachments ea
       JOIN evaluations e ON e.id = ea.evaluation_id
       WHERE ea.id = $1`,
      [attachmentId]
    );

    if (!attachRes.rows.length) return notFound(res, 'Attachment not found');
    const att = attachRes.rows[0];

    // Permission check
    const user = req.user;
    let allowed = false;

    if (user.role === 'admin') {
      allowed = true;
    } else if (user.role === 'teacher' && att.teacher_user_id === user.id) {
      allowed = true;
    } else if (user.role === 'parent') {
      const parentCheck = await query(
        `SELECT id FROM student_parents WHERE student_id = $1 AND parent_user_id = $2`,
        [att.student_id, user.id]
      );
      allowed = parentCheck.rows.length > 0;
    }

    if (!allowed) return forbidden(res, 'You do not have permission to access this file');

    const stream = getFileStream(att.file_name);
    if (!stream) return notFound(res, 'File not found on disk');

    res.setHeader('Content-Type', att.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${att.original_name}"`);
    stream.pipe(res);
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/admin/export-logs
router.get('/admin/export-logs', async (req, res) => {
  if (req.user.role !== 'admin') return forbidden(res);
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
router.get('/admin/dashboard-stats', async (req, res) => {
  if (req.user.role !== 'admin') return forbidden(res);
  try {
    const [usersRes, studentsRes, evalsRes, hoursRes] = await Promise.all([
      query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
      query(`SELECT status, COUNT(*) as count FROM students GROUP BY status`),
      query(`SELECT COUNT(*) as count FROM evaluations WHERE evaluation_date >= NOW() - INTERVAL '30 days'`),
      query(`SELECT COALESCE(SUM(hours_worked), 0) as total FROM teacher_hours WHERE work_date >= NOW() - INTERVAL '30 days'`),
    ]);

    const users = {};
    usersRes.rows.forEach((r) => { users[r.role] = parseInt(r.count); });
    const students = {};
    studentsRes.rows.forEach((r) => { students[r.status] = parseInt(r.count); });

    return ok(res, {
      users,
      students,
      evaluations_last_30_days: parseInt(evalsRes.rows[0].count),
      teacher_hours_last_30_days: parseFloat(hoursRes.rows[0].total),
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/teacher/dashboard-stats
router.get('/teacher/dashboard-stats', async (req, res) => {
  if (req.user.role !== 'teacher') return forbidden(res);
  try {
    const [studentsRes, evalsRes] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM student_teachers WHERE teacher_user_id = $1`, [req.user.id]),
      query(`SELECT COUNT(*) as count FROM evaluations WHERE teacher_user_id = $1 AND evaluation_date >= NOW() - INTERVAL '7 days'`, [req.user.id]),
    ]);

    return ok(res, {
      assigned_students: parseInt(studentsRes.rows[0].count),
      evaluations_this_week: parseInt(evalsRes.rows[0].count),
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/teacher/subjects-with-templates — used when creating evaluations
router.get('/teacher/subjects-with-templates', async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') return forbidden(res);
  try {
    const result = await query(
      `SELECT DISTINCT s.id, s.name, et.id AS template_id, et.name AS template_name
       FROM subjects s
       JOIN evaluation_templates et ON et.subject_id = s.id AND et.status = 'active'
       WHERE s.status = 'active'
       ORDER BY s.name`
    );
    return ok(res, { subjects: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/teacher/templates/:subjectId/questions
router.get('/teacher/templates/:subjectId/questions', async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') return forbidden(res);
  try {
    const { subjectId } = req.params;
    const tplRes = await query(
      `SELECT id FROM evaluation_templates WHERE subject_id = $1 AND status = 'active' LIMIT 1`, [subjectId]
    );
    if (!tplRes.rows.length) return notFound(res, 'No active template for this subject');

    const qRes = await query(
      'SELECT * FROM evaluation_questions WHERE template_id = $1 ORDER BY sort_order', [tplRes.rows[0].id]
    );
    return ok(res, { template_id: tplRes.rows[0].id, questions: qRes.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
