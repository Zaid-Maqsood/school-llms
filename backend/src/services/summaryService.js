/**
 * Summary Service
 * Rule-based aggregation of evaluation data into readable summaries.
 * No AI — deterministic logic only.
 */
const { query } = require('../config/db');

/**
 * Generate a subject-level summary for a student over a date range.
 */
async function generateSubjectSummary(studentId, subjectId, fromDate, toDate) {
  // Fetch all evaluations in range
  const evalResult = await query(
    `SELECT e.id, e.evaluation_date, e.general_notes, e.strengths_text, e.struggles_text,
            s.name AS subject_name
     FROM evaluations e
     JOIN subjects s ON s.id = e.subject_id
     WHERE e.student_id = $1 AND e.subject_id = $2
       AND e.evaluation_date >= $3 AND e.evaluation_date <= $4
     ORDER BY e.evaluation_date ASC`,
    [studentId, subjectId, fromDate, toDate]
  );

  const evals = evalResult.rows;
  if (!evals.length) return null;

  const evalIds = evals.map((e) => e.id);
  const subjectName = evals[0].subject_name;
  const totalEvaluations = evals.length;

  // Fetch all answers for these evaluations
  const answerResult = await query(
    `SELECT ea.evaluation_id, ea.answer_rating, ea.answer_yes_no, ea.answer_text, ea.answer_select,
            eq.answer_type, eq.prompt, eq.sort_order
     FROM evaluation_answers ea
     JOIN evaluation_questions eq ON eq.id = ea.question_id
     WHERE ea.evaluation_id = ANY($1::uuid[])`,
    [evalIds]
  );

  const answers = answerResult.rows;

  // Aggregate rating answers
  const ratingAnswers = answers.filter((a) => a.answer_type === 'rating' && a.answer_rating != null);
  const avgRating = ratingAnswers.length
    ? ratingAnswers.reduce((sum, a) => sum + parseInt(a.answer_rating), 0) / ratingAnswers.length
    : null;

  // Trend: compare first half vs second half
  let trendStatus = 'stable';
  if (totalEvaluations >= 4) {
    const midPoint = Math.floor(totalEvaluations / 2);
    const firstHalfIds = evalIds.slice(0, midPoint);
    const secondHalfIds = evalIds.slice(midPoint);

    const firstHalfRatings = ratingAnswers.filter((a) => firstHalfIds.includes(a.evaluation_id));
    const secondHalfRatings = ratingAnswers.filter((a) => secondHalfIds.includes(a.evaluation_id));

    const avgFirst = firstHalfRatings.length
      ? firstHalfRatings.reduce((s, a) => s + parseInt(a.answer_rating), 0) / firstHalfRatings.length
      : null;
    const avgSecond = secondHalfRatings.length
      ? secondHalfRatings.reduce((s, a) => s + parseInt(a.answer_rating), 0) / secondHalfRatings.length
      : null;

    if (avgFirst !== null && avgSecond !== null) {
      const diff = avgSecond - avgFirst;
      if (diff >= 0.4) trendStatus = 'improving';
      else if (diff <= -0.4) trendStatus = 'needs_attention';
      else trendStatus = 'stable';
    }
  }

  // Yes/No positive ratio
  const yesNoAnswers = answers.filter((a) => a.answer_type === 'yes_no' && a.answer_yes_no != null);
  const positiveCount = yesNoAnswers.filter((a) => a.answer_yes_no === true).length;
  const positiveRatio = yesNoAnswers.length ? positiveCount / yesNoAnswers.length : null;

  // Collect strengths and struggles text
  const strengths = evals
    .filter((e) => e.strengths_text && e.strengths_text.trim())
    .map((e) => e.strengths_text.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i) // deduplicate
    .slice(0, 5);

  const struggles = evals
    .filter((e) => e.struggles_text && e.struggles_text.trim())
    .map((e) => e.struggles_text.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);

  // Recent notes (last 5)
  const recentNotes = evals
    .filter((e) => e.general_notes && e.general_notes.trim())
    .slice(-5)
    .map((e) => ({ date: e.evaluation_date, note: e.general_notes.trim() }));

  // Generate narrative summary
  const generatedSummary = buildNarrative({
    subjectName,
    totalEvaluations,
    avgRating,
    trendStatus,
    positiveRatio,
    strengths,
    struggles,
    fromDate,
    toDate,
  });

  return {
    subject_id: subjectId,
    subject_name: subjectName,
    average_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
    total_evaluations: totalEvaluations,
    trend_status: trendStatus,
    positive_behavior_ratio: positiveRatio ? Math.round(positiveRatio * 100) : null,
    strengths,
    struggles,
    recent_notes: recentNotes,
    generated_summary: generatedSummary,
    period_from: fromDate,
    period_to: toDate,
  };
}

function buildNarrative({ subjectName, totalEvaluations, avgRating, trendStatus, positiveRatio, strengths, struggles, fromDate, toDate }) {
  const parts = [];

  const from = new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const to = new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  parts.push(`During the period from ${from} to ${to}, the student had ${totalEvaluations} recorded session${totalEvaluations !== 1 ? 's' : ''} in ${subjectName}.`);

  if (avgRating !== null) {
    const ratingLabel =
      avgRating >= 4.5 ? 'excellent' :
      avgRating >= 3.5 ? 'good' :
      avgRating >= 2.5 ? 'developing' : 'limited';

    parts.push(`Overall performance was ${ratingLabel}, with an average score of ${(avgRating).toFixed(1)} out of 5.`);
  }

  if (trendStatus === 'improving') {
    parts.push(`Progress is trending upward — performance improved notably in the second half of this period.`);
  } else if (trendStatus === 'needs_attention') {
    parts.push(`Performance has shown a downward trend compared to the start of this period and may need additional support.`);
  } else {
    parts.push(`Performance has remained consistent throughout this period.`);
  }

  if (strengths.length > 0) {
    parts.push(`Areas of strength observed include: ${strengths[0]}`);
    if (strengths.length > 1) parts[parts.length - 1] += ` and ${strengths[1].toLowerCase()}`;
    parts[parts.length - 1] += '.';
  }

  if (struggles.length > 0) {
    parts.push(`Areas that would benefit from continued support include: ${struggles[0].toLowerCase()}.`);
  }

  if (positiveRatio !== null) {
    if (positiveRatio >= 0.8) {
      parts.push(`The student consistently demonstrated positive engagement and compliance.`);
    } else if (positiveRatio >= 0.6) {
      parts.push(`The student generally engaged positively, with some areas still developing.`);
    } else {
      parts.push(`Several behavioral or task-completion goals are still developing and require ongoing attention.`);
    }
  }

  return parts.join(' ');
}

/**
 * Get date range for a period type.
 */
function getPeriodDates(period, customFrom, customTo) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (period === 'weekly') {
    const start = new Date(today);
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return {
      from: start.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  }

  if (period === 'monthly') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      from: start.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  }

  if (period === 'range' && customFrom && customTo) {
    return { from: customFrom, to: customTo };
  }

  // Default: last 30 days
  const start = new Date(today);
  start.setDate(start.getDate() - 30);
  return {
    from: start.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
}

/**
 * Generate full child summary across all subjects.
 */
async function generateChildSummary(studentId, period, customFrom, customTo) {
  const { from, to } = getPeriodDates(period, customFrom, customTo);

  // Find subjects that have evaluations for this student in range
  const subjectResult = await query(
    `SELECT DISTINCT e.subject_id FROM evaluations e
     WHERE e.student_id = $1 AND e.evaluation_date >= $2 AND e.evaluation_date <= $3`,
    [studentId, from, to]
  );

  const subjectIds = subjectResult.rows.map((r) => r.subject_id);
  const summaries = await Promise.all(
    subjectIds.map((sid) => generateSubjectSummary(studentId, sid, from, to))
  );

  return {
    student_id: studentId,
    period,
    period_from: from,
    period_to: to,
    subjects: summaries.filter(Boolean),
  };
}

module.exports = { generateChildSummary, generateSubjectSummary, getPeriodDates };
