import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getMyStudents, getSubjectsWithTemplates, getTemplateQuestions, createEvaluation, uploadAttachments } from '../../api/teacher';
import LoadingSpinner from '../../components/LoadingSpinner';

function RatingInput({ question, value, onChange }) {
  return (
    <div>
      <label className="form-label text-sm">{question.prompt} {question.required && <span className="text-red-500">*</span>}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors ${
              value === n
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-300 hover:border-blue-400 text-gray-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Poor</span><span>Excellent</span>
      </div>
    </div>
  );
}

function YesNoInput({ question, value, onChange }) {
  return (
    <div>
      <label className="form-label text-sm">{question.prompt} {question.required && <span className="text-red-500">*</span>}</label>
      <div className="flex gap-3">
        {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(({ label, val }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(val)}
            className={`px-5 py-2 rounded-md border text-sm font-medium transition-colors ${
              value === val
                ? (val ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700')
                : 'border-gray-300 hover:border-gray-400 text-gray-600'
            }`}
          >
            {val ? '✓ ' : '✗ '}{label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectInput({ question, value, onChange }) {
  const options = question.options_json ? (typeof question.options_json === 'string' ? JSON.parse(question.options_json) : question.options_json) : [];
  return (
    <div>
      <label className="form-label text-sm">{question.prompt} {question.required && <span className="text-red-500">*</span>}</label>
      <select className="form-select" value={value || ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Select an option...</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function TextInput({ question, value, onChange }) {
  return (
    <div>
      <label className="form-label text-sm">{question.prompt} {question.required && <span className="text-red-500">*</span>}</label>
      <textarea className="form-textarea" rows={2} value={value || ''} onChange={(e) => onChange(e.target.value || null)} />
    </div>
  );
}

export default function NewEvaluation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedStudentId = searchParams.get('student_id');

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [templateId, setTemplateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    student_id: preselectedStudentId || '',
    subject_id: '',
    evaluation_date: today,
    general_notes: '',
    strengths_text: '',
    struggles_text: '',
  });
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState([]);

  useEffect(() => {
    Promise.all([getMyStudents(), getSubjectsWithTemplates()])
      .then(([sRes, subRes]) => {
        setStudents(sRes.data.students.filter((s) => s.status === 'active'));
        setSubjects(subRes.data.subjects);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubjectChange = async (subjectId) => {
    setForm((f) => ({ ...f, subject_id: subjectId }));
    setAnswers({});
    setQuestions([]);
    if (!subjectId) return;
    setQuestionsLoading(true);
    try {
      const r = await getTemplateQuestions(subjectId);
      setQuestions(r.data.questions);
      setTemplateId(r.data.template_id);
    } catch (e) {
      setError(e.response?.data?.error || 'No active template for this subject');
    } finally { setQuestionsLoading(false); }
  };

  const setAnswer = (questionId, type, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { question_id: questionId, ...prev[questionId], [`answer_${type}`]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    // Validate required questions
    const missing = questions.filter((q) => {
      if (!q.required) return false;
      const ans = answers[q.id];
      if (!ans) return true;
      if (q.answer_type === 'rating') return ans.answer_rating == null;
      if (q.answer_type === 'yes_no') return ans.answer_yes_no == null;
      if (q.answer_type === 'short_text') return !ans.answer_text;
      if (q.answer_type === 'single_select') return !ans.answer_select;
      return false;
    });

    if (missing.length) {
      setError(`Please answer all required questions (${missing.length} missing)`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        answers: Object.values(answers),
      };
      const r = await createEvaluation(payload);
      const evalId = r.data.evaluation.id;

      // Upload files if any
      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        await uploadAttachments(evalId, fd);
      }

      setSuccess('Evaluation submitted successfully!');
      setTimeout(() => navigate('/teacher/evaluations'), 1500);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to submit evaluation');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Evaluation</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded">{success}</div>}

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Evaluation Details</h2>
          <div>
            <label className="form-label">Student *</label>
            <select className="form-select" required value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}>
              <option value="">Select student...</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.display_name || `${s.first_name} ${s.last_name}`}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Subject *</label>
              <select className="form-select" required value={form.subject_id} onChange={(e) => handleSubjectChange(e.target.value)}>
                <option value="">Select subject...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" required value={form.evaluation_date} max={today} onChange={(e) => setForm((f) => ({ ...f, evaluation_date: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Dynamic Questions */}
        {questionsLoading && <LoadingSpinner message="Loading questions..." />}
        {questions.length > 0 && (
          <div className="card space-y-6">
            <h2 className="font-semibold text-gray-900">Evaluation Questions</h2>
            {questions.map((q) => {
              const ans = answers[q.id] || {};
              return (
                <div key={q.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  {q.answer_type === 'rating' && (
                    <RatingInput question={q} value={ans.answer_rating ?? null} onChange={(v) => setAnswer(q.id, 'rating', v)} />
                  )}
                  {q.answer_type === 'yes_no' && (
                    <YesNoInput question={q} value={ans.answer_yes_no ?? null} onChange={(v) => setAnswer(q.id, 'yes_no', v)} />
                  )}
                  {q.answer_type === 'single_select' && (
                    <SelectInput question={q} value={ans.answer_select ?? null} onChange={(v) => setAnswer(q.id, 'select', v)} />
                  )}
                  {q.answer_type === 'short_text' && (
                    <TextInput question={q} value={ans.answer_text ?? null} onChange={(v) => setAnswer(q.id, 'text', v)} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Notes */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Teacher Notes</h2>
          <div>
            <label className="form-label">Strengths Observed Today</label>
            <textarea className="form-textarea" rows={2} value={form.strengths_text} onChange={(e) => setForm((f) => ({ ...f, strengths_text: e.target.value }))} placeholder="What did the student do well today?" />
          </div>
          <div>
            <label className="form-label">Areas Needing Support</label>
            <textarea className="form-textarea" rows={2} value={form.struggles_text} onChange={(e) => setForm((f) => ({ ...f, struggles_text: e.target.value }))} placeholder="What areas need more attention?" />
          </div>
          <div>
            <label className="form-label">General Notes</label>
            <textarea className="form-textarea" rows={2} value={form.general_notes} onChange={(e) => setForm((f) => ({ ...f, general_notes: e.target.value }))} placeholder="Any additional observations..." />
          </div>
        </div>

        {/* Attachments */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Attachments (Optional)</h2>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-400 mt-2">Supported: JPG, PNG, WebP, MP4, MOV, WebM. Max 50MB per file.</p>
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {files.map((f, i) => (
                <span key={i} className="badge-gray text-xs">{f.name}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting || !form.student_id || !form.subject_id} className="btn-primary">
            {submitting ? 'Submitting...' : 'Submit Evaluation'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
