const router = require('express').Router();
const { query, getClient } = require('../../config/db');
const { upload } = require('../../middleware/upload');
const { ok, created, badRequest, notFound, forbidden, conflict, serverError } = require('../../utils/response');

// GET /api/teacher/evaluations
router.get('/', async (req, res) => {
  try {
    const { student_id, subject_id, date_from, date_to } = req.query;
    let sql = `
      SELECT e.id, e.student_id, e.subject_id, e.evaluation_date,
             e.general_notes, e.strengths_text, e.struggles_text, e.created_at,
             s.first_name || ' ' || s.last_name AS student_name,
             sub.name AS subject_name,
             (SELECT COUNT(*) FROM evaluation_attachments ea WHERE ea.evaluation_id = e.id) AS attachment_count
      FROM evaluations e
      JOIN students s ON s.id = e.student_id
      JOIN subjects sub ON sub.id = e.subject_id
      WHERE e.teacher_user_id = $1
    `;
    const params = [req.user.id]; let idx = 2;

    if (student_id) { sql += ` AND e.student_id = $${idx++}`; params.push(student_id); }
    if (subject_id) { sql += ` AND e.subject_id = $${idx++}`; params.push(subject_id); }
    if (date_from) { sql += ` AND e.evaluation_date >= $${idx++}`; params.push(date_from); }
    if (date_to) { sql += ` AND e.evaluation_date <= $${idx++}`; params.push(date_to); }
    sql += ' ORDER BY e.evaluation_date DESC, e.created_at DESC LIMIT 100';

    const result = await query(sql, params);
    return ok(res, { evaluations: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/teacher/evaluations/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const evalRes = await query(
      `SELECT e.*, s.first_name || ' ' || s.last_name AS student_name, sub.name AS subject_name
       FROM evaluations e
       JOIN students s ON s.id = e.student_id
       JOIN subjects sub ON sub.id = e.subject_id
       WHERE e.id = $1 AND e.teacher_user_id = $2`,
      [id, req.user.id]
    );
    if (!evalRes.rows.length) return notFound(res, 'Evaluation not found');

    const answersRes = await query(
      `SELECT ea.*, eq.prompt, eq.answer_type, eq.sort_order, eq.options_json
       FROM evaluation_answers ea
       JOIN evaluation_questions eq ON eq.id = ea.question_id
       WHERE ea.evaluation_id = $1
       ORDER BY eq.sort_order`,
      [id]
    );

    const attachRes = await query(
      `SELECT id, file_name, original_name, mime_type, file_size, created_at
       FROM evaluation_attachments WHERE evaluation_id = $1 ORDER BY created_at`,
      [id]
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

// POST /api/teacher/evaluations
router.post('/', async (req, res) => {
  const dbClient = await getClient();
  try {
    const { student_id, subject_id, evaluation_date, general_notes, strengths_text, struggles_text, answers } = req.body;

    if (!student_id || !subject_id || !evaluation_date) {
      return badRequest(res, 'student_id, subject_id, and evaluation_date are required');
    }

    // Verify teacher is assigned to student
    const assignCheck = await dbClient.query(
      `SELECT id FROM student_teachers WHERE student_id = $1 AND teacher_user_id = $2`,
      [student_id, req.user.id]
    );
    if (!assignCheck.rows.length) {
      dbClient.release();
      return forbidden(res, 'You are not assigned to this student');
    }

    // Verify student is active
    const studentCheck = await dbClient.query(`SELECT status FROM students WHERE id = $1`, [student_id]);
    if (!studentCheck.rows.length) { dbClient.release(); return notFound(res, 'Student not found'); }
    if (studentCheck.rows[0].status === 'inactive') { dbClient.release(); return badRequest(res, 'Cannot evaluate inactive student'); }

    // Verify subject has active template
    const templateCheck = await dbClient.query(
      `SELECT et.id FROM evaluation_templates et WHERE et.subject_id = $1 AND et.status = 'active' LIMIT 1`, [subject_id]
    );
    if (!templateCheck.rows.length) { dbClient.release(); return badRequest(res, 'No active evaluation template for this subject'); }
    const templateId = templateCheck.rows[0].id;

    // Check required questions answered
    if (answers && Array.isArray(answers)) {
      const reqQuestions = await dbClient.query(
        `SELECT id FROM evaluation_questions WHERE template_id = $1 AND required = true`, [templateId]
      );
      const answeredIds = answers.map((a) => a.question_id);
      for (const q of reqQuestions.rows) {
        if (!answeredIds.includes(q.id)) {
          dbClient.release();
          return badRequest(res, `A required question was not answered`);
        }
      }
    }

    await dbClient.query('BEGIN');

    const evalRes = await dbClient.query(
      `INSERT INTO evaluations (student_id, teacher_user_id, subject_id, evaluation_date, general_notes, strengths_text, struggles_text)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [student_id, req.user.id, subject_id, evaluation_date, general_notes || null, strengths_text || null, struggles_text || null]
    );
    const evaluation = evalRes.rows[0];

    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        await dbClient.query(
          `INSERT INTO evaluation_answers (evaluation_id, question_id, answer_rating, answer_yes_no, answer_text, answer_select)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [evaluation.id, ans.question_id, ans.answer_rating ?? null, ans.answer_yes_no ?? null, ans.answer_text ?? null, ans.answer_select ?? null]
        );
      }
    }

    await dbClient.query('COMMIT');
    return created(res, { evaluation });
  } catch (err) {
    await dbClient.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return conflict(res, 'Evaluation already submitted for this student, subject, and date');
    return serverError(res, err);
  } finally {
    dbClient.release();
  }
});

// PUT /api/teacher/evaluations/:id
router.put('/:id', async (req, res) => {
  const dbClient = await getClient();
  try {
    const { id } = req.params;
    const { general_notes, strengths_text, struggles_text, answers } = req.body;

    const existing = await dbClient.query(
      'SELECT id FROM evaluations WHERE id = $1 AND teacher_user_id = $2', [id, req.user.id]
    );
    if (!existing.rows.length) { dbClient.release(); return notFound(res, 'Evaluation not found'); }

    await dbClient.query('BEGIN');

    await dbClient.query(
      `UPDATE evaluations SET general_notes = $1, strengths_text = $2, struggles_text = $3 WHERE id = $4`,
      [general_notes ?? null, strengths_text ?? null, struggles_text ?? null, id]
    );

    if (answers && Array.isArray(answers)) {
      await dbClient.query('DELETE FROM evaluation_answers WHERE evaluation_id = $1', [id]);
      for (const ans of answers) {
        await dbClient.query(
          `INSERT INTO evaluation_answers (evaluation_id, question_id, answer_rating, answer_yes_no, answer_text, answer_select)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id, ans.question_id, ans.answer_rating ?? null, ans.answer_yes_no ?? null, ans.answer_text ?? null, ans.answer_select ?? null]
        );
      }
    }

    await dbClient.query('COMMIT');
    const result = await query('SELECT * FROM evaluations WHERE id = $1', [id]);
    return ok(res, { evaluation: result.rows[0] });
  } catch (err) {
    await dbClient.query('ROLLBACK').catch(() => {});
    return serverError(res, err);
  } finally {
    dbClient.release();
  }
});

// POST /api/teacher/evaluations/:id/attachments
router.post('/:id/attachments', upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const evalCheck = await query(
      'SELECT id FROM evaluations WHERE id = $1 AND teacher_user_id = $2', [id, req.user.id]
    );
    if (!evalCheck.rows.length) return notFound(res, 'Evaluation not found');

    if (!req.files || !req.files.length) return badRequest(res, 'No files uploaded');

    const attachments = [];
    for (const file of req.files) {
      const result = await query(
        `INSERT INTO evaluation_attachments (evaluation_id, file_name, original_name, mime_type, file_size, storage_path)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [id, file.filename, file.originalname, file.mimetype, file.size, file.path]
      );
      attachments.push(result.rows[0]);
    }

    return created(res, { attachments });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
