const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, notFound, serverError } = require('../../utils/response');
const { generateChildSummary } = require('../../services/summaryService');

// GET /api/parent/children
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT s.id, s.first_name, s.last_name, s.display_name, s.grade_class, s.status, s.date_of_birth
       FROM students s
       JOIN student_parents sp ON sp.student_id = s.id
       WHERE sp.parent_user_id = $1
       ORDER BY s.first_name`,
      [req.user.id]
    );
    return ok(res, { children: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/parent/children/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT s.id, s.first_name, s.last_name, s.display_name, s.grade_class, s.status, s.date_of_birth, s.notes
       FROM students s
       JOIN student_parents sp ON sp.student_id = s.id
       WHERE s.id = $1 AND sp.parent_user_id = $2`,
      [id, req.user.id]
    );
    if (!result.rows.length) return notFound(res, 'Child not found');

    // Subjects this child has been evaluated in
    const subjectsRes = await query(
      `SELECT DISTINCT sub.id, sub.name FROM evaluations e
       JOIN subjects sub ON sub.id = e.subject_id
       WHERE e.student_id = $1 ORDER BY sub.name`,
      [id]
    );

    // Assigned teachers
    const teachersRes = await query(
      `SELECT u.first_name, u.last_name FROM student_teachers st
       JOIN users u ON u.id = st.teacher_user_id WHERE st.student_id = $1`,
      [id]
    );

    return ok(res, {
      child: result.rows[0],
      subjects: subjectsRes.rows,
      teachers: teachersRes.rows,
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/parent/children/:id/evaluations
router.get('/:id/evaluations', async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, date_from, date_to } = req.query;

    // Verify parent owns this child
    const childCheck = await query(
      `SELECT s.id FROM students s JOIN student_parents sp ON sp.student_id = s.id
       WHERE s.id = $1 AND sp.parent_user_id = $2`,
      [id, req.user.id]
    );
    if (!childCheck.rows.length) return notFound(res, 'Child not found');

    let sql = `
      SELECT e.id, e.evaluation_date, e.subject_id, e.general_notes, e.strengths_text, e.struggles_text,
             sub.name AS subject_name,
             u.first_name || ' ' || u.last_name AS teacher_name,
             (SELECT COUNT(*) FROM evaluation_attachments ea WHERE ea.evaluation_id = e.id) AS attachment_count
      FROM evaluations e
      JOIN subjects sub ON sub.id = e.subject_id
      JOIN users u ON u.id = e.teacher_user_id
      WHERE e.student_id = $1
    `;
    const params = [id]; let idx = 2;
    if (subject_id) { sql += ` AND e.subject_id = $${idx++}`; params.push(subject_id); }
    if (date_from) { sql += ` AND e.evaluation_date >= $${idx++}`; params.push(date_from); }
    if (date_to) { sql += ` AND e.evaluation_date <= $${idx++}`; params.push(date_to); }
    sql += ' ORDER BY e.evaluation_date DESC LIMIT 100';

    const result = await query(sql, params);
    return ok(res, { evaluations: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/parent/children/:id/evaluations/:evalId (detail with answers + attachments)
router.get('/:id/evaluations/:evalId', async (req, res) => {
  try {
    const { id, evalId } = req.params;

    // Verify child belongs to parent
    const childCheck = await query(
      `SELECT s.id FROM students s JOIN student_parents sp ON sp.student_id = s.id
       WHERE s.id = $1 AND sp.parent_user_id = $2`,
      [id, req.user.id]
    );
    if (!childCheck.rows.length) return notFound(res, 'Child not found');

    const evalRes = await query(
      `SELECT e.*, sub.name AS subject_name, u.first_name || ' ' || u.last_name AS teacher_name
       FROM evaluations e
       JOIN subjects sub ON sub.id = e.subject_id
       JOIN users u ON u.id = e.teacher_user_id
       WHERE e.id = $1 AND e.student_id = $2`,
      [evalId, id]
    );
    if (!evalRes.rows.length) return notFound(res, 'Evaluation not found');

    const answersRes = await query(
      `SELECT ea.answer_rating, ea.answer_yes_no, ea.answer_text, ea.answer_select,
              eq.prompt, eq.answer_type, eq.sort_order
       FROM evaluation_answers ea
       JOIN evaluation_questions eq ON eq.id = ea.question_id
       WHERE ea.evaluation_id = $1 ORDER BY eq.sort_order`,
      [evalId]
    );

    const attachRes = await query(
      `SELECT id, original_name, mime_type, file_size, created_at FROM evaluation_attachments
       WHERE evaluation_id = $1 ORDER BY created_at`,
      [evalId]
    );

    return ok(res, {
      evaluation: evalRes.rows[0],
      answers: answersRes.rows,
      attachments: attachRes.rows,
    });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/parent/children/:id/summary
router.get('/:id/summary', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'weekly', from, to } = req.query;

    // Verify parent owns this child
    const childCheck = await query(
      `SELECT s.id FROM students s JOIN student_parents sp ON sp.student_id = s.id
       WHERE s.id = $1 AND sp.parent_user_id = $2`,
      [id, req.user.id]
    );
    if (!childCheck.rows.length) return notFound(res, 'Child not found');

    const summary = await generateChildSummary(id, period, from, to);
    return ok(res, { summary });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
