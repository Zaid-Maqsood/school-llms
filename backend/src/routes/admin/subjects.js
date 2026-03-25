const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, created, badRequest, notFound, conflict, serverError } = require('../../utils/response');

// GET /api/admin/subjects
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM subjects WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = $1'; params.push(status); }
    sql += ' ORDER BY name';
    const result = await query(sql, params);
    return ok(res, { subjects: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/subjects
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return badRequest(res, 'name is required');

    const existing = await query('SELECT id FROM subjects WHERE name ILIKE $1', [name.trim()]);
    if (existing.rows.length) return conflict(res, 'Subject with this name already exists');

    const result = await query(
      'INSERT INTO subjects (name) VALUES ($1) RETURNING *', [name.trim()]
    );
    return created(res, { subject: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/admin/subjects/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const existing = await query('SELECT id FROM subjects WHERE id = $1', [id]);
    if (!existing.rows.length) return notFound(res, 'Subject not found');

    const updates = []; const params = []; let idx = 1;
    if (name) {
      const dup = await query('SELECT id FROM subjects WHERE name ILIKE $1 AND id != $2', [name.trim(), id]);
      if (dup.rows.length) return conflict(res, 'Subject name already in use');
      updates.push(`name = $${idx++}`); params.push(name.trim());
    }
    if (status) {
      if (!['active', 'inactive'].includes(status)) return badRequest(res, 'status must be active or inactive');
      updates.push(`status = $${idx++}`); params.push(status);
    }
    if (!updates.length) return badRequest(res, 'No fields to update');

    params.push(id);
    const result = await query(`UPDATE subjects SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params);
    return ok(res, { subject: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
