const router = require('express').Router();
const bcrypt = require('bcrypt');
const { query } = require('../../config/db');
const { ok, created, badRequest, notFound, conflict, serverError } = require('../../utils/response');

const SALT_ROUNDS = 10;

// GET /api/admin/users
router.get('/', async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let sql = `SELECT id, first_name, last_name, email, role, status, created_at, updated_at FROM users WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (role) { sql += ` AND role = $${idx++}`; params.push(role); }
    if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
    if (search) { sql += ` AND (first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    return ok(res, { users: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/users
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    if (!first_name || !last_name || !email || !password || !role) {
      return badRequest(res, 'first_name, last_name, email, password, and role are required');
    }
    if (!['teacher', 'parent', 'admin'].includes(role)) {
      return badRequest(res, 'role must be admin, teacher, or parent');
    }
    if (password.length < 6) {
      return badRequest(res, 'Password must be at least 6 characters');
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length) return conflict(res, 'Email already in use');

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, first_name, last_name, email, role, status, created_at`,
      [first_name.trim(), last_name.trim(), email.toLowerCase().trim(), hash, role]
    );
    return created(res, { user: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/admin/users/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, password, status } = req.body;

    const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (!existing.rows.length) return notFound(res, 'User not found');

    const updates = [];
    const params = [];
    let idx = 1;

    if (first_name) { updates.push(`first_name = $${idx++}`); params.push(first_name.trim()); }
    if (last_name) { updates.push(`last_name = $${idx++}`); params.push(last_name.trim()); }
    if (email) {
      const dup = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase().trim(), id]);
      if (dup.rows.length) return conflict(res, 'Email already in use');
      updates.push(`email = $${idx++}`); params.push(email.toLowerCase().trim());
    }
    if (password) {
      if (password.length < 6) return badRequest(res, 'Password must be at least 6 characters');
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      updates.push(`password_hash = $${idx++}`); params.push(hash);
    }
    if (status) {
      if (!['active', 'inactive'].includes(status)) return badRequest(res, 'status must be active or inactive');
      updates.push(`status = $${idx++}`); params.push(status);
    }

    if (!updates.length) return badRequest(res, 'No fields to update');

    params.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, first_name, last_name, email, role, status, updated_at`,
      params
    );
    return ok(res, { user: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
