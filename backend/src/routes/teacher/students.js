const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, notFound, serverError } = require('../../utils/response');

// GET /api/teacher/students — only assigned active students
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.first_name, s.last_name, s.display_name, s.grade_class, s.status, s.notes
       FROM students s
       JOIN student_teachers st ON st.student_id = s.id
       WHERE st.teacher_user_id = $1
       ORDER BY s.last_name, s.first_name`,
      [req.user.id]
    );
    return ok(res, { students: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/teacher/students/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT s.* FROM students s
       JOIN student_teachers st ON st.student_id = s.id
       WHERE s.id = $1 AND st.teacher_user_id = $2`,
      [id, req.user.id]
    );
    if (!result.rows.length) return notFound(res, 'Student not found or not assigned to you');

    // Fetch evaluations history for this student by this teacher
    const evalsRes = await query(
      `SELECT e.id, e.evaluation_date, e.subject_id, e.general_notes, e.strengths_text, e.struggles_text,
              s.name AS subject_name, e.created_at
       FROM evaluations e
       JOIN subjects s ON s.id = e.subject_id
       WHERE e.student_id = $1 AND e.teacher_user_id = $2
       ORDER BY e.evaluation_date DESC LIMIT 20`,
      [id, req.user.id]
    );

    return ok(res, { student: result.rows[0], recent_evaluations: evalsRes.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
