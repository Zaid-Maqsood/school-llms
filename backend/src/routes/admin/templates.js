const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, created, badRequest, notFound, serverError } = require('../../utils/response');

// GET /api/admin/templates
router.get('/', async (req, res) => {
  try {
    const { subject_id, status } = req.query;
    let sql = `SELECT et.*, s.name AS subject_name FROM evaluation_templates et JOIN subjects s ON s.id = et.subject_id WHERE 1=1`;
    const params = []; let idx = 1;
    if (subject_id) { sql += ` AND et.subject_id = $${idx++}`; params.push(subject_id); }
    if (status) { sql += ` AND et.status = $${idx++}`; params.push(status); }
    sql += ' ORDER BY et.created_at DESC';
    const result = await query(sql, params);
    return ok(res, { templates: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/admin/templates/:id (with questions)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tRes = await query(
      `SELECT et.*, s.name AS subject_name FROM evaluation_templates et JOIN subjects s ON s.id = et.subject_id WHERE et.id = $1`, [id]
    );
    if (!tRes.rows.length) return notFound(res, 'Template not found');

    const qRes = await query(
      'SELECT * FROM evaluation_questions WHERE template_id = $1 ORDER BY sort_order', [id]
    );
    return ok(res, { template: { ...tRes.rows[0], questions: qRes.rows } });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/templates
router.post('/', async (req, res) => {
  try {
    const { subject_id, name, status = 'active' } = req.body;
    if (!subject_id || !name?.trim()) return badRequest(res, 'subject_id and name are required');

    const subjectExists = await query('SELECT id FROM subjects WHERE id = $1', [subject_id]);
    if (!subjectExists.rows.length) return notFound(res, 'Subject not found');

    const result = await query(
      `INSERT INTO evaluation_templates (subject_id, name, status) VALUES ($1,$2,$3) RETURNING *`,
      [subject_id, name.trim(), status]
    );
    return created(res, { template: { ...result.rows[0], questions: [] } });
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/admin/templates/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const existing = await query('SELECT id FROM evaluation_templates WHERE id = $1', [id]);
    if (!existing.rows.length) return notFound(res, 'Template not found');

    const updates = []; const params = []; let idx = 1;
    if (name) { updates.push(`name = $${idx++}`); params.push(name.trim()); }
    if (status) {
      if (!['active', 'inactive'].includes(status)) return badRequest(res, 'Invalid status');
      updates.push(`status = $${idx++}`); params.push(status);
    }
    if (!updates.length) return badRequest(res, 'No fields to update');

    params.push(id);
    const result = await query(`UPDATE evaluation_templates SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return ok(res, { template: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/templates/:id/questions
router.post('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt, answer_type, required = true, sort_order = 0, options_json } = req.body;

    if (!prompt?.trim() || !answer_type) return badRequest(res, 'prompt and answer_type are required');
    if (!['rating', 'yes_no', 'short_text', 'single_select'].includes(answer_type)) {
      return badRequest(res, 'answer_type must be rating, yes_no, short_text, or single_select');
    }
    if (answer_type === 'single_select' && (!options_json || !Array.isArray(options_json) || !options_json.length)) {
      return badRequest(res, 'options_json (array) is required for single_select questions');
    }

    const tExists = await query('SELECT id FROM evaluation_templates WHERE id = $1', [id]);
    if (!tExists.rows.length) return notFound(res, 'Template not found');

    const result = await query(
      `INSERT INTO evaluation_questions (template_id, prompt, answer_type, required, sort_order, options_json)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, prompt.trim(), answer_type, required, sort_order, options_json ? JSON.stringify(options_json) : null]
    );
    return created(res, { question: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/admin/questions/:id
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt, answer_type, required, sort_order, options_json } = req.body;

    const existing = await query('SELECT id FROM evaluation_questions WHERE id = $1', [id]);
    if (!existing.rows.length) return notFound(res, 'Question not found');

    const updates = []; const params = []; let idx = 1;
    if (prompt !== undefined) { updates.push(`prompt = $${idx++}`); params.push(prompt.trim()); }
    if (answer_type !== undefined) { updates.push(`answer_type = $${idx++}`); params.push(answer_type); }
    if (required !== undefined) { updates.push(`required = $${idx++}`); params.push(required); }
    if (sort_order !== undefined) { updates.push(`sort_order = $${idx++}`); params.push(sort_order); }
    if (options_json !== undefined) { updates.push(`options_json = $${idx++}`); params.push(JSON.stringify(options_json)); }
    if (!updates.length) return badRequest(res, 'No fields to update');

    params.push(id);
    const result = await query(`UPDATE evaluation_questions SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return ok(res, { question: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
