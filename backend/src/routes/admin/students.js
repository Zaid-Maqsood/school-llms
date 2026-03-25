const router = require('express').Router();
const { query } = require('../../config/db');
const { ok, created, badRequest, notFound, conflict, serverError } = require('../../utils/response');

// GET /api/admin/students
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    let sql = `SELECT id, first_name, last_name, display_name, date_of_birth, grade_class, status, notes, created_at, updated_at FROM students WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
    if (search) { sql += ` AND (first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR display_name ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    sql += ' ORDER BY last_name, first_name';

    const result = await query(sql, params);

    // Fetch relationships
    const studentIds = result.rows.map((s) => s.id);
    let teacherMap = {}, parentMap = {};

    if (studentIds.length) {
      const tRes = await query(
        `SELECT st.student_id, u.id, u.first_name, u.last_name, u.email
         FROM student_teachers st JOIN users u ON u.id = st.teacher_user_id
         WHERE st.student_id = ANY($1::uuid[])`,
        [studentIds]
      );
      tRes.rows.forEach((r) => {
        if (!teacherMap[r.student_id]) teacherMap[r.student_id] = [];
        teacherMap[r.student_id].push({ id: r.id, first_name: r.first_name, last_name: r.last_name, email: r.email });
      });

      const pRes = await query(
        `SELECT sp.student_id, u.id, u.first_name, u.last_name, u.email
         FROM student_parents sp JOIN users u ON u.id = sp.parent_user_id
         WHERE sp.student_id = ANY($1::uuid[])`,
        [studentIds]
      );
      pRes.rows.forEach((r) => {
        if (!parentMap[r.student_id]) parentMap[r.student_id] = [];
        parentMap[r.student_id].push({ id: r.id, first_name: r.first_name, last_name: r.last_name, email: r.email });
      });
    }

    const students = result.rows.map((s) => ({
      ...s,
      teachers: teacherMap[s.id] || [],
      parents: parentMap[s.id] || [],
    }));

    return ok(res, { students });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/admin/students/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM students WHERE id = $1', [id]);
    if (!result.rows.length) return notFound(res, 'Student not found');

    const student = result.rows[0];

    const tRes = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email FROM student_teachers st
       JOIN users u ON u.id = st.teacher_user_id WHERE st.student_id = $1`, [id]
    );
    const pRes = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email FROM student_parents sp
       JOIN users u ON u.id = sp.parent_user_id WHERE sp.student_id = $1`, [id]
    );

    return ok(res, { student: { ...student, teachers: tRes.rows, parents: pRes.rows } });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/students
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, display_name, date_of_birth, grade_class, notes } = req.body;
    if (!first_name || !last_name) return badRequest(res, 'first_name and last_name are required');

    const result = await query(
      `INSERT INTO students (first_name, last_name, display_name, date_of_birth, grade_class, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [first_name.trim(), last_name.trim(), display_name?.trim() || null, date_of_birth || null, grade_class?.trim() || null, notes?.trim() || null]
    );
    return created(res, { student: { ...result.rows[0], teachers: [], parents: [] } });
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/admin/students/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, display_name, date_of_birth, grade_class, status, notes } = req.body;

    const existing = await query('SELECT id FROM students WHERE id = $1', [id]);
    if (!existing.rows.length) return notFound(res, 'Student not found');

    const updates = [];
    const params = [];
    let idx = 1;

    if (first_name !== undefined) { updates.push(`first_name = $${idx++}`); params.push(first_name.trim()); }
    if (last_name !== undefined) { updates.push(`last_name = $${idx++}`); params.push(last_name.trim()); }
    if (display_name !== undefined) { updates.push(`display_name = $${idx++}`); params.push(display_name?.trim() || null); }
    if (date_of_birth !== undefined) { updates.push(`date_of_birth = $${idx++}`); params.push(date_of_birth || null); }
    if (grade_class !== undefined) { updates.push(`grade_class = $${idx++}`); params.push(grade_class?.trim() || null); }
    if (notes !== undefined) { updates.push(`notes = $${idx++}`); params.push(notes?.trim() || null); }
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) return badRequest(res, 'status must be active or inactive');
      updates.push(`status = $${idx++}`); params.push(status);
    }

    if (!updates.length) return badRequest(res, 'No fields to update');

    params.push(id);
    const result = await query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`, params
    );
    return ok(res, { student: result.rows[0] });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/students/:id/teachers — assign teachers
router.post('/:id/teachers', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_ids } = req.body;

    const student = await query('SELECT id FROM students WHERE id = $1', [id]);
    if (!student.rows.length) return notFound(res, 'Student not found');

    if (!Array.isArray(teacher_ids) || !teacher_ids.length) {
      return badRequest(res, 'teacher_ids must be a non-empty array');
    }

    // Validate all are teachers
    const teacherCheck = await query(
      `SELECT id FROM users WHERE id = ANY($1::uuid[]) AND role = 'teacher'`, [teacher_ids]
    );
    if (teacherCheck.rows.length !== teacher_ids.length) {
      return badRequest(res, 'One or more IDs are not valid teacher accounts');
    }

    // Remove existing then re-insert
    await query('DELETE FROM student_teachers WHERE student_id = $1', [id]);
    for (const tid of teacher_ids) {
      await query('INSERT INTO student_teachers (student_id, teacher_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, tid]);
    }

    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email FROM student_teachers st
       JOIN users u ON u.id = st.teacher_user_id WHERE st.student_id = $1`, [id]
    );
    return ok(res, { teachers: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/students/:id/parents — assign parents
router.post('/:id/parents', async (req, res) => {
  try {
    const { id } = req.params;
    const { parent_ids } = req.body;

    const student = await query('SELECT id FROM students WHERE id = $1', [id]);
    if (!student.rows.length) return notFound(res, 'Student not found');

    if (!Array.isArray(parent_ids) || !parent_ids.length) {
      return badRequest(res, 'parent_ids must be a non-empty array');
    }

    const parentCheck = await query(
      `SELECT id FROM users WHERE id = ANY($1::uuid[]) AND role = 'parent'`, [parent_ids]
    );
    if (parentCheck.rows.length !== parent_ids.length) {
      return badRequest(res, 'One or more IDs are not valid parent accounts');
    }

    await query('DELETE FROM student_parents WHERE student_id = $1', [id]);
    for (const pid of parent_ids) {
      await query('INSERT INTO student_parents (student_id, parent_user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, pid]);
    }

    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email FROM student_parents sp
       JOIN users u ON u.id = sp.parent_user_id WHERE sp.student_id = $1`, [id]
    );
    return ok(res, { parents: result.rows });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
