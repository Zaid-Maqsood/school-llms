const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, serverError } = require('../../utils/response');

// GET /api/admin/grades
router.get('/', async (req, res) => {
  try {
    // Get all students
    const studentsRes = await query(`SELECT id, display_name, grade_class FROM students WHERE status = 'active' ORDER BY display_name`);

    // Get average ratings per student per subject from evaluation answers
    const ratingsRes = await query(`
      SELECT
        e.student_id,
        s.name AS subject_name,
        ROUND(AVG(ea.answer_rating) * 20) AS score
      FROM evaluation_answers ea
      JOIN evaluations e ON e.id = ea.evaluation_id
      JOIN subjects s ON s.id = e.subject_id
      JOIN evaluation_questions eq ON eq.id = ea.question_id
      WHERE ea.answer_rating IS NOT NULL
      GROUP BY e.student_id, s.name
    `);

    // Build lookup map: student_id -> { subject -> score }
    const map = {};
    for (const row of ratingsRes.rows) {
      if (!map[row.student_id]) map[row.student_id] = {};
      map[row.student_id][row.subject_name] = parseInt(row.score);
    }

    const grades = studentsRes.rows.map(s => ({
      id: s.id,
      student: s.display_name,
      grade: s.grade_class,
      scores: map[s.id] || {},
    }));

    return ok(res, { grades });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
