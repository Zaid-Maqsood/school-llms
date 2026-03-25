const router = require('express').Router();
const { query } = require('../../config/db');
const { materialsUpload } = require('../../middleware/upload');
const { ok, created, notFound, badRequest, serverError } = require('../../utils/response');

// GET /api/parent/assignments — all assignments from teachers of parent's children
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT DISTINCT a.*, sub.id AS submission_id, sub.grade, sub.status AS submission_status, sub.file_name AS submitted_file
       FROM assignments a
       JOIN student_teachers st ON st.teacher_user_id = a.teacher_user_id
       JOIN student_parents sp ON sp.student_id = st.student_id AND sp.parent_user_id = $1
       LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.parent_user_id = $1
       ORDER BY a.due_date ASC`,
      [req.user.id]
    );
    return ok(res, { assignments: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/parent/assignments/:id/submit
router.post('/:id/submit', materialsUpload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, student_name } = req.body;

    const aCheck = await query('SELECT id FROM assignments WHERE id = $1', [id]);
    if (!aCheck.rows.length) return notFound(res, 'Assignment not found');

    const existing = await query(
      'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND parent_user_id = $2',
      [id, req.user.id]
    );

    const fileName = req.file?.originalname || null;
    const filePath = req.file?.filename || null;

    if (existing.rows.length) {
      const r = await query(
        `UPDATE assignment_submissions SET file_name=$1, file_path=$2, notes=$3, status='submitted', submitted_at=NOW() WHERE id=$4 RETURNING *`,
        [fileName, filePath, notes || null, existing.rows[0].id]
      );
      return ok(res, { submission: r.rows[0] });
    }

    const r = await query(
      `INSERT INTO assignment_submissions (assignment_id, parent_user_id, student_name, file_name, file_path, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, req.user.id, student_name || null, fileName, filePath, notes || null]
    );
    return created(res, { submission: r.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
