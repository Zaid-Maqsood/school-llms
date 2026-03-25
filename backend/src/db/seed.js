require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    await client.query('BEGIN');

    // Clear existing data (in reverse dependency order)
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM export_logs');
    await client.query('DELETE FROM teacher_hours');
    await client.query('DELETE FROM evaluation_attachments');
    await client.query('DELETE FROM evaluation_answers');
    await client.query('DELETE FROM evaluations');
    await client.query('DELETE FROM evaluation_questions');
    await client.query('DELETE FROM evaluation_templates');
    await client.query('DELETE FROM student_parents');
    await client.query('DELETE FROM student_teachers');
    await client.query('DELETE FROM students');
    await client.query('DELETE FROM subjects');
    await client.query('DELETE FROM users');

    // ── Users ─────────────────────────────────────────────
    const adminHash = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    const teacher1Hash = await bcrypt.hash('Teacher@123', SALT_ROUNDS);
    const teacher2Hash = await bcrypt.hash('Teacher@123', SALT_ROUNDS);
    const parent1Hash = await bcrypt.hash('Parent@123', SALT_ROUNDS);
    const parent2Hash = await bcrypt.hash('Parent@123', SALT_ROUNDS);

    const adminRes = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Sarah', 'Mitchell', 'admin@schoolms.com', adminHash, 'admin']
    );
    const adminId = adminRes.rows[0].id;

    const t1Res = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['James', 'Turner', 'james.turner@schoolms.com', teacher1Hash, 'teacher']
    );
    const teacher1Id = t1Res.rows[0].id;

    const t2Res = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Maria', 'Lopez', 'maria.lopez@schoolms.com', teacher2Hash, 'teacher']
    );
    const teacher2Id = t2Res.rows[0].id;

    const p1Res = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Robert', 'Johnson', 'robert.johnson@schoolms.com', parent1Hash, 'parent']
    );
    const parent1Id = p1Res.rows[0].id;

    const p2Res = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Linda', 'Chen', 'linda.chen@schoolms.com', parent2Hash, 'parent']
    );
    const parent2Id = p2Res.rows[0].id;

    console.log('✓ Users seeded');

    // ── Students ──────────────────────────────────────────
    const s1Res = await client.query(
      `INSERT INTO students (first_name, last_name, display_name, date_of_birth, grade_class, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['Ethan', 'Johnson', 'Ethan J.', '2016-04-12', 'Grade 3', 'Energetic learner, needs reminders to stay on task.']
    );
    const student1Id = s1Res.rows[0].id;

    const s2Res = await client.query(
      `INSERT INTO students (first_name, last_name, display_name, date_of_birth, grade_class, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['Mia', 'Chen', 'Mia C.', '2015-09-03', 'Grade 4', 'Strong reader, excels in creative writing.']
    );
    const student2Id = s2Res.rows[0].id;

    const s3Res = await client.query(
      `INSERT INTO students (first_name, last_name, display_name, date_of_birth, grade_class) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Lucas', 'Williams', 'Lucas W.', '2016-01-22', 'Grade 3']
    );
    const student3Id = s3Res.rows[0].id;

    const s4Res = await client.query(
      `INSERT INTO students (first_name, last_name, display_name, date_of_birth, grade_class) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      ['Ava', 'Martinez', 'Ava M.', '2015-06-15', 'Grade 4']
    );
    const student4Id = s4Res.rows[0].id;

    const s5Res = await client.query(
      `INSERT INTO students (first_name, last_name, display_name, date_of_birth, grade_class, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      ['Noah', 'Brown', 'Noah B.', '2017-02-28', 'Grade 2', 'Recently enrolled. Making good progress.']
    );
    const student5Id = s5Res.rows[0].id;

    console.log('✓ Students seeded');

    // ── Assignments ───────────────────────────────────────
    // Teacher 1 → Students 1, 3
    await client.query(`INSERT INTO student_teachers (student_id, teacher_user_id) VALUES ($1,$2)`, [student1Id, teacher1Id]);
    await client.query(`INSERT INTO student_teachers (student_id, teacher_user_id) VALUES ($1,$2)`, [student3Id, teacher1Id]);
    await client.query(`INSERT INTO student_teachers (student_id, teacher_user_id) VALUES ($1,$2)`, [student5Id, teacher1Id]);

    // Teacher 2 → Students 2, 4
    await client.query(`INSERT INTO student_teachers (student_id, teacher_user_id) VALUES ($1,$2)`, [student2Id, teacher2Id]);
    await client.query(`INSERT INTO student_teachers (student_id, teacher_user_id) VALUES ($1,$2)`, [student4Id, teacher2Id]);

    // Parent 1 → Student 1 (Ethan Johnson = Robert Johnson's son)
    await client.query(`INSERT INTO student_parents (student_id, parent_user_id) VALUES ($1,$2)`, [student1Id, parent1Id]);

    // Parent 2 → Student 2 (Mia Chen = Linda Chen's daughter)
    await client.query(`INSERT INTO student_parents (student_id, parent_user_id) VALUES ($1,$2)`, [student2Id, parent2Id]);

    // Give parent1 a second child
    await client.query(`INSERT INTO student_parents (student_id, parent_user_id) VALUES ($1,$2)`, [student3Id, parent1Id]);

    console.log('✓ Assignments seeded');

    // ── Subjects ──────────────────────────────────────────
    const subjectNames = ['Math', 'Reading', 'Writing', 'Science', 'Behavior & Social Skills'];
    const subjectIds = {};
    for (const name of subjectNames) {
      const res = await client.query(
        `INSERT INTO subjects (name) VALUES ($1) RETURNING id`, [name]
      );
      subjectIds[name] = res.rows[0].id;
    }

    console.log('✓ Subjects seeded');

    // ── Evaluation Templates ──────────────────────────────
    // Math template
    const mathTplRes = await client.query(
      `INSERT INTO evaluation_templates (subject_id, name) VALUES ($1,$2) RETURNING id`,
      [subjectIds['Math'], 'Math Daily Evaluation']
    );
    const mathTplId = mathTplRes.rows[0].id;

    const mathQuestions = [
      { prompt: 'How well did the student understand today\'s math concept?', type: 'rating', required: true, order: 1 },
      { prompt: 'Did the student complete all assigned math problems?', type: 'yes_no', required: true, order: 2 },
      { prompt: 'Rate the student\'s ability to work independently on math tasks.', type: 'rating', required: true, order: 3 },
      { prompt: 'Did the student demonstrate understanding of number concepts?', type: 'yes_no', required: true, order: 4 },
      { prompt: 'Rate the student\'s problem-solving approach today.', type: 'rating', required: true, order: 5 },
      { prompt: 'Did the student ask for help when needed?', type: 'yes_no', required: false, order: 6 },
      { prompt: 'How would you rate the student\'s accuracy in calculations?', type: 'rating', required: true, order: 7 },
      { prompt: 'Did the student show their work clearly?', type: 'yes_no', required: false, order: 8 },
      { prompt: 'Rate the student\'s engagement and attention during math instruction.', type: 'rating', required: true, order: 9 },
      { prompt: 'Which area did the student focus on today?', type: 'single_select', required: false, order: 10, options: ['Addition/Subtraction', 'Multiplication/Division', 'Word Problems', 'Geometry', 'Fractions', 'Number Sense'] },
      { prompt: 'Additional notes on math performance:', type: 'short_text', required: false, order: 11 },
    ];

    for (const q of mathQuestions) {
      await client.query(
        `INSERT INTO evaluation_questions (template_id, prompt, answer_type, required, sort_order, options_json) VALUES ($1,$2,$3,$4,$5,$6)`,
        [mathTplId, q.prompt, q.type, q.required, q.order, q.options ? JSON.stringify(q.options) : null]
      );
    }

    // Reading template
    const readTplRes = await client.query(
      `INSERT INTO evaluation_templates (subject_id, name) VALUES ($1,$2) RETURNING id`,
      [subjectIds['Reading'], 'Reading Daily Evaluation']
    );
    const readTplId = readTplRes.rows[0].id;

    const readingQuestions = [
      { prompt: 'Rate the student\'s reading fluency today.', type: 'rating', required: true, order: 1 },
      { prompt: 'Did the student demonstrate reading comprehension?', type: 'yes_no', required: true, order: 2 },
      { prompt: 'Rate the student\'s ability to decode unfamiliar words.', type: 'rating', required: true, order: 3 },
      { prompt: 'Did the student read with appropriate expression and pacing?', type: 'yes_no', required: false, order: 4 },
      { prompt: 'Rate the student\'s vocabulary understanding.', type: 'rating', required: true, order: 5 },
      { prompt: 'Was the student able to summarize what they read?', type: 'yes_no', required: true, order: 6 },
      { prompt: 'Rate the student\'s ability to answer comprehension questions.', type: 'rating', required: true, order: 7 },
      { prompt: 'Did the student make connections to prior knowledge?', type: 'yes_no', required: false, order: 8 },
      { prompt: 'What reading activity did the student engage in today?', type: 'single_select', required: false, order: 9, options: ['Independent Reading', 'Guided Reading', 'Read Aloud', 'Partner Reading', 'Phonics Practice'] },
      { prompt: 'Rate the student\'s overall engagement with reading today.', type: 'rating', required: true, order: 10 },
      { prompt: 'Specific observations on reading performance:', type: 'short_text', required: false, order: 11 },
    ];

    for (const q of readingQuestions) {
      await client.query(
        `INSERT INTO evaluation_questions (template_id, prompt, answer_type, required, sort_order, options_json) VALUES ($1,$2,$3,$4,$5,$6)`,
        [readTplId, q.prompt, q.type, q.required, q.order, q.options ? JSON.stringify(q.options) : null]
      );
    }

    // Writing template
    const writeTplRes = await client.query(
      `INSERT INTO evaluation_templates (subject_id, name) VALUES ($1,$2) RETURNING id`,
      [subjectIds['Writing'], 'Writing Daily Evaluation']
    );
    const writeTplId = writeTplRes.rows[0].id;

    const writingQuestions = [
      { prompt: 'Rate the student\'s ability to organize their writing today.', type: 'rating', required: true, order: 1 },
      { prompt: 'Did the student use correct grammar and punctuation?', type: 'yes_no', required: true, order: 2 },
      { prompt: 'Rate the student\'s sentence structure and variety.', type: 'rating', required: true, order: 3 },
      { prompt: 'Did the student stay on topic throughout their writing?', type: 'yes_no', required: true, order: 4 },
      { prompt: 'Rate the student\'s vocabulary use and word choice.', type: 'rating', required: true, order: 5 },
      { prompt: 'Did the student revise or edit their work?', type: 'yes_no', required: false, order: 6 },
      { prompt: 'Rate the student\'s overall writing quality today.', type: 'rating', required: true, order: 7 },
      { prompt: 'What type of writing did the student work on?', type: 'single_select', required: false, order: 8, options: ['Narrative', 'Informational', 'Opinion', 'Journal Entry', 'Creative Writing', 'Research'] },
      { prompt: 'Rate the student\'s effort and persistence during writing.', type: 'rating', required: true, order: 9 },
      { prompt: 'Did the student use a graphic organizer or planning tool?', type: 'yes_no', required: false, order: 10 },
      { prompt: 'Writing-specific feedback and observations:', type: 'short_text', required: false, order: 11 },
    ];

    for (const q of writingQuestions) {
      await client.query(
        `INSERT INTO evaluation_questions (template_id, prompt, answer_type, required, sort_order, options_json) VALUES ($1,$2,$3,$4,$5,$6)`,
        [writeTplId, q.prompt, q.type, q.required, q.order, q.options ? JSON.stringify(q.options) : null]
      );
    }

    // Behavior template
    const behavTplRes = await client.query(
      `INSERT INTO evaluation_templates (subject_id, name) VALUES ($1,$2) RETURNING id`,
      [subjectIds['Behavior & Social Skills'], 'Behavior & Social Skills Daily Evaluation']
    );
    const behavTplId = behavTplRes.rows[0].id;

    const behaviorQuestions = [
      { prompt: 'Rate the student\'s overall behavior today.', type: 'rating', required: true, order: 1 },
      { prompt: 'Did the student follow classroom rules consistently?', type: 'yes_no', required: true, order: 2 },
      { prompt: 'Rate the student\'s ability to cooperate with peers.', type: 'rating', required: true, order: 3 },
      { prompt: 'Did the student listen and follow instructions on the first request?', type: 'yes_no', required: true, order: 4 },
      { prompt: 'Rate the student\'s emotional regulation today.', type: 'rating', required: true, order: 5 },
      { prompt: 'Did the student participate positively in group activities?', type: 'yes_no', required: false, order: 6 },
      { prompt: 'Rate the student\'s respect toward teachers and peers.', type: 'rating', required: true, order: 7 },
      { prompt: 'Did the student resolve any conflicts appropriately?', type: 'yes_no', required: false, order: 8 },
      { prompt: 'Rate the student\'s focus and on-task behavior.', type: 'rating', required: true, order: 9 },
      { prompt: 'How was the student\'s overall mood and attitude today?', type: 'single_select', required: false, order: 10, options: ['Excellent', 'Good', 'Neutral', 'Challenging', 'Difficult'] },
      { prompt: 'Any specific behavioral incidents or highlights:', type: 'short_text', required: false, order: 11 },
    ];

    for (const q of behaviorQuestions) {
      await client.query(
        `INSERT INTO evaluation_questions (template_id, prompt, answer_type, required, sort_order, options_json) VALUES ($1,$2,$3,$4,$5,$6)`,
        [behavTplId, q.prompt, q.type, q.required, q.order, q.options ? JSON.stringify(q.options) : null]
      );
    }

    // Science template
    const sciTplRes = await client.query(
      `INSERT INTO evaluation_templates (subject_id, name) VALUES ($1,$2) RETURNING id`,
      [subjectIds['Science'], 'Science Daily Evaluation']
    );
    const sciTplId = sciTplRes.rows[0].id;

    const scienceQuestions = [
      { prompt: 'Rate the student\'s understanding of today\'s science concept.', type: 'rating', required: true, order: 1 },
      { prompt: 'Did the student actively participate in science activities or experiments?', type: 'yes_no', required: true, order: 2 },
      { prompt: 'Rate the student\'s ability to follow experimental procedures correctly.', type: 'rating', required: true, order: 3 },
      { prompt: 'Did the student make accurate observations and record data?', type: 'yes_no', required: true, order: 4 },
      { prompt: 'Rate the student\'s ability to ask scientific questions and think critically.', type: 'rating', required: true, order: 5 },
      { prompt: 'Did the student demonstrate understanding of cause and effect relationships?', type: 'yes_no', required: false, order: 6 },
      { prompt: 'Rate the student\'s ability to explain their findings or conclusions.', type: 'rating', required: true, order: 7 },
      { prompt: 'Did the student connect today\'s topic to prior science knowledge?', type: 'yes_no', required: false, order: 8 },
      { prompt: 'Rate the student\'s engagement and curiosity during the science lesson.', type: 'rating', required: true, order: 9 },
      { prompt: 'Did the student handle materials and equipment safely and responsibly?', type: 'yes_no', required: true, order: 10 },
      { prompt: 'Which science area did the student focus on today?', type: 'single_select', required: false, order: 11, options: ['Life Science', 'Earth Science', 'Physical Science', 'Environmental Science', 'Scientific Method', 'Data & Measurement'] },
      { prompt: 'Additional notes on science performance:', type: 'short_text', required: false, order: 12 },
    ];

    for (const q of scienceQuestions) {
      await client.query(
        `INSERT INTO evaluation_questions (template_id, prompt, answer_type, required, sort_order, options_json) VALUES ($1,$2,$3,$4,$5,$6)`,
        [sciTplId, q.prompt, q.type, q.required, q.order, q.options ? JSON.stringify(q.options) : null]
      );
    }

    console.log('✓ Templates and questions seeded');

    // ── Sample Evaluations ────────────────────────────────
    // Generate evaluations for the past 3 weeks
    const today = new Date();
    const getDateStr = (daysAgo) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      // Skip weekends
      const day = d.getDay();
      if (day === 0) d.setDate(d.getDate() - 2);
      if (day === 6) d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    };

    const evalDays = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19];

    // Helper to insert evaluation with answers
    const insertEval = async (studentId, teacherId, subjectId, templateId, dateStr, data) => {
      const existing = await client.query(
        `SELECT id FROM evaluations WHERE student_id=$1 AND teacher_user_id=$2 AND subject_id=$3 AND evaluation_date=$4`,
        [studentId, teacherId, subjectId, dateStr]
      );
      if (existing.rows.length > 0) return existing.rows[0].id;

      const evalRes = await client.query(
        `INSERT INTO evaluations (student_id, teacher_user_id, subject_id, evaluation_date, general_notes, strengths_text, struggles_text)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [studentId, teacherId, subjectId, dateStr, data.notes, data.strengths, data.struggles]
      );
      const evalId = evalRes.rows[0].id;

      const questRes = await client.query(
        `SELECT id, answer_type, sort_order FROM evaluation_questions WHERE template_id=$1 ORDER BY sort_order`, [templateId]
      );

      for (const q of questRes.rows) {
        const ratings = data.ratings || {};
        const yesnos = data.yesnos || {};
        let aRating = null, aYesNo = null, aText = null, aSelect = null;

        if (q.answer_type === 'rating') {
          aRating = ratings[q.sort_order] || Math.floor(Math.random() * 2) + 3;
        } else if (q.answer_type === 'yes_no') {
          aYesNo = yesnos[q.sort_order] !== undefined ? yesnos[q.sort_order] : Math.random() > 0.3;
        } else if (q.answer_type === 'short_text') {
          aText = data.textNote || null;
        } else if (q.answer_type === 'single_select') {
          aSelect = data.selectAnswer || null;
        }

        await client.query(
          `INSERT INTO evaluation_answers (evaluation_id, question_id, answer_rating, answer_yes_no, answer_text, answer_select)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [evalId, q.id, aRating, aYesNo, aText, aSelect]
        );
      }
      return evalId;
    };

    // Ethan (student1) - Teacher1 - Math & Reading evaluations
    for (let i = 0; i < evalDays.length; i++) {
      const dateStr = getDateStr(evalDays[i]);
      const ratingBase = i < 5 ? 3 : i < 10 ? 3 : 4; // slight improvement over time

      await insertEval(student1Id, teacher1Id, subjectIds['Math'], mathTplId, dateStr, {
        notes: i % 3 === 0 ? 'Ethan was engaged and focused during math today.' : null,
        strengths: i % 2 === 0 ? 'Shows strong number sense and quick recall of math facts.' : 'Demonstrated persistence with word problems.',
        struggles: i % 3 === 0 ? 'Needs more practice with multi-step problems.' : 'Occasionally rushes through work without checking answers.',
        ratings: { 1: ratingBase, 3: ratingBase, 5: ratingBase, 7: ratingBase + (i > 10 ? 1 : 0), 9: ratingBase },
        yesnos: { 2: true, 4: i > 5, 6: true, 8: i % 2 === 0 },
        textNote: i % 4 === 0 ? 'Good session today.' : null,
        selectAnswer: 'Number Sense',
      });

      if (i < 10) {
        await insertEval(student1Id, teacher1Id, subjectIds['Reading'], readTplId, dateStr, {
          notes: i % 4 === 0 ? 'Ethan read with good expression today.' : null,
          strengths: 'Decodes new words well and reads with good pace.',
          struggles: i % 2 === 0 ? 'Comprehension questions require more support.' : null,
          ratings: { 1: ratingBase + 1, 3: ratingBase, 5: ratingBase, 7: ratingBase, 9: ratingBase, 10: ratingBase },
          yesnos: { 2: true, 4: true, 6: i > 3, 8: i > 7 },
          selectAnswer: 'Guided Reading',
        });
      }
    }

    // Mia (student2) - Teacher2 - Reading & Writing evaluations (stronger student)
    for (let i = 0; i < evalDays.length; i++) {
      const dateStr = getDateStr(evalDays[i]);
      const ratingBase = 4;

      await insertEval(student2Id, teacher2Id, subjectIds['Reading'], readTplId, dateStr, {
        notes: i % 3 === 0 ? 'Mia demonstrated excellent comprehension today.' : null,
        strengths: 'Exceptional vocabulary and ability to make text connections.',
        struggles: i < 5 ? 'Could slow down to improve accuracy with phonics.' : null,
        ratings: { 1: ratingBase, 3: ratingBase + 1, 5: ratingBase + 1, 7: ratingBase, 9: ratingBase + 1, 10: ratingBase + 1 },
        yesnos: { 2: true, 4: true, 6: true, 8: true },
        selectAnswer: 'Independent Reading',
      });

      if (i < 12) {
        await insertEval(student2Id, teacher2Id, subjectIds['Writing'], writeTplId, dateStr, {
          notes: i % 4 === 0 ? 'Mia produced a well-structured paragraph today.' : null,
          strengths: 'Strong sentence variety and creative vocabulary choices.',
          struggles: i % 3 === 0 ? 'Sometimes needs reminders to check punctuation.' : null,
          ratings: { 1: ratingBase + 1, 3: ratingBase, 5: ratingBase + 1, 7: ratingBase + 1, 9: ratingBase },
          yesnos: { 2: i > 5, 4: true, 6: true, 10: i > 8 },
          selectAnswer: 'Narrative',
        });
      }
    }

    // Lucas (student3) - Teacher1 - Math & Behavior evaluations
    for (let i = 0; i < evalDays.slice(0, 10).length; i++) {
      const dateStr = getDateStr(evalDays[i]);
      const ratingBase = 3;

      await insertEval(student3Id, teacher1Id, subjectIds['Math'], mathTplId, dateStr, {
        notes: i % 3 === 0 ? 'Lucas worked hard today despite challenges.' : null,
        strengths: 'Willing to try new approaches and asks good questions.',
        struggles: 'Needs additional support with subtraction with regrouping.',
        ratings: { 1: ratingBase, 3: ratingBase - 1, 5: ratingBase, 7: ratingBase - 1, 9: ratingBase },
        yesnos: { 2: i > 3, 4: i > 6, 6: true, 8: false },
        selectAnswer: 'Addition/Subtraction',
      });

      await insertEval(student3Id, teacher1Id, subjectIds['Behavior & Social Skills'], behavTplId, dateStr, {
        notes: null,
        strengths: i > 5 ? 'Showing improvement in peer interactions.' : 'Kind and inclusive with peers.',
        struggles: i < 7 ? 'Difficulty transitioning between activities.' : null,
        ratings: { 1: ratingBase, 3: ratingBase + 1, 5: ratingBase - 1, 7: ratingBase + 1, 9: ratingBase },
        yesnos: { 2: i > 4, 4: i > 7, 6: true, 8: i > 9 },
        selectAnswer: 'Good',
      });
    }

    console.log('✓ Evaluations seeded');

    // ── Teacher Hours ─────────────────────────────────────
    const hoursData = [
      { daysAgo: 1, hours: 7.5, notes: 'Regular school day' },
      { daysAgo: 2, hours: 8.0, notes: 'Staff meeting after school' },
      { daysAgo: 3, hours: 7.5, notes: null },
      { daysAgo: 4, hours: 7.5, notes: null },
      { daysAgo: 5, hours: 8.5, notes: 'Parent-teacher conference day' },
      { daysAgo: 8, hours: 7.5, notes: null },
      { daysAgo: 9, hours: 7.5, notes: null },
      { daysAgo: 10, hours: 8.0, notes: 'Professional development session' },
      { daysAgo: 11, hours: 7.5, notes: null },
      { daysAgo: 12, hours: 7.5, notes: null },
      { daysAgo: 15, hours: 7.5, notes: null },
      { daysAgo: 16, hours: 7.5, notes: null },
    ];

    for (const h of hoursData) {
      const dateStr = getDateStr(h.daysAgo);
      // Teacher 1
      await client.query(
        `INSERT INTO teacher_hours (teacher_user_id, work_date, hours_worked, notes, created_by_admin_user_id) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (teacher_user_id, work_date) DO NOTHING`,
        [teacher1Id, dateStr, h.hours, h.notes, adminId]
      );
      // Teacher 2 (slightly different hours)
      await client.query(
        `INSERT INTO teacher_hours (teacher_user_id, work_date, hours_worked, notes, created_by_admin_user_id) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (teacher_user_id, work_date) DO NOTHING`,
        [teacher2Id, dateStr, h.hours + 0.5, h.notes, adminId]
      );
    }

    console.log('✓ Teacher hours seeded');

    await client.query('COMMIT');
    console.log('\n✅ Database seeded successfully!\n');
    console.log('Test credentials:');
    console.log('  Admin:     admin@schoolms.com     / Admin@123');
    console.log('  Teacher 1: james.turner@schoolms.com  / Teacher@123');
    console.log('  Teacher 2: maria.lopez@schoolms.com   / Teacher@123');
    console.log('  Parent 1:  robert.johnson@schoolms.com / Parent@123');
    console.log('  Parent 2:  linda.chen@schoolms.com     / Parent@123\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
