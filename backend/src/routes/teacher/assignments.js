const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, created, notFound, badRequest, serverError } = require('../../utils/response');

// GET /api/teacher/assignments
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, COUNT(s.id) AS submission_count
       FROM assignments a
       LEFT JOIN assignment_submissions s ON s.assignment_id = a.id
       WHERE a.teacher_user_id = $1
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );
    return ok(res, { assignments: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/teacher/assignments
router.post('/', async (req, res) => {
  try {
    const { title, subject, due_date, instructions } = req.body;
    if (!title?.trim()) return badRequest(res, 'title is required');
    const r = await query(
      `INSERT INTO assignments (title, subject, due_date, instructions, teacher_user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title.trim(), subject, due_date || null, instructions || null, req.user.id]
    );
    return created(res, { assignment: { ...r.rows[0], submission_count: 0 } });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/teacher/assignments/:id — with submissions
router.get('/:id', async (req, res) => {
  try {
    const aRes = await query('SELECT * FROM assignments WHERE id = $1 AND teacher_user_id = $2', [req.params.id, req.user.id]);
    if (!aRes.rows.length) return notFound(res, 'Assignment not found');

    const sRes = await query(
      `SELECT s.*, u.first_name, u.last_name FROM assignment_submissions s
       JOIN users u ON u.id = s.parent_user_id
       WHERE s.assignment_id = $1 ORDER BY s.submitted_at`,
      [req.params.id]
    );
    return ok(res, { assignment: { ...aRes.rows[0], submissions: sRes.rows } });
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/teacher/assignments/:id/submissions/:subId/grade
router.put('/:id/submissions/:subId/grade', async (req, res) => {
  try {
    const { grade } = req.body;
    if (!grade) return badRequest(res, 'grade is required');
    const r = await query(
      `UPDATE assignment_submissions SET grade = $1, status = 'graded' WHERE id = $2 RETURNING *`,
      [grade, req.params.subId]
    );
    if (!r.rows.length) return notFound(res, 'Submission not found');
    return ok(res, { submission: r.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// DELETE /api/teacher/assignments/:id
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM assignments WHERE id = $1 AND teacher_user_id = $2', [req.params.id, req.user.id]);
    return ok(res, { message: 'Deleted' });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
