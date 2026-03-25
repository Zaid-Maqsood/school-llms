import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getMyEvaluations, getMyStudents, getSubjectsWithTemplates, getEvaluation } from '../../api/teacher';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

function EvalDetail({ evalId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvaluation(evalId)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [evalId]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div className="text-red-600">Could not load evaluation</div>;

  const { evaluation, answers, attachments } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-gray-500">Student:</span> <strong>{evaluation.student_name}</strong></div>
        <div><span className="text-gray-500">Subject:</span> <strong>{evaluation.subject_name}</strong></div>
        <div><span className="text-gray-500">Date:</span> {evaluation.evaluation_date?.split('T')[0]}</div>
      </div>

      {evaluation.strengths_text && (
        <div className="p-3 bg-green-50 rounded-md">
          <div className="text-xs font-medium text-green-700 mb-1">Strengths</div>
          <p className="text-sm text-green-800">{evaluation.strengths_text}</p>
        </div>
      )}
      {evaluation.struggles_text && (
        <div className="p-3 bg-orange-50 rounded-md">
          <div className="text-xs font-medium text-orange-700 mb-1">Areas Needing Support</div>
          <p className="text-sm text-orange-800">{evaluation.struggles_text}</p>
        </div>
      )}
      {evaluation.general_notes && (
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs font-medium text-gray-500 mb-1">General Notes</div>
          <p className="text-sm text-gray-800">{evaluation.general_notes}</p>
        </div>
      )}

      {answers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Answers</h4>
          <div className="space-y-2">
            {answers.map((a) => (
              <div key={a.id} className="text-sm border-b border-gray-100 pb-2">
                <div className="text-gray-600 text-xs">{a.prompt}</div>
                <div className="font-medium mt-0.5">
                  {a.answer_type === 'rating' && a.answer_rating != null && (
                    <span className="flex gap-1">
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} className={`text-lg ${n <= a.answer_rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                      <span className="text-gray-500 text-xs ml-1">({a.answer_rating}/5)</span>
                    </span>
                  )}
                  {a.answer_type === 'yes_no' && (
                    <span className={a.answer_yes_no ? 'text-green-600' : 'text-red-600'}>
                      {a.answer_yes_no ? '✓ Yes' : '✗ No'}
                    </span>
                  )}
                  {a.answer_type === 'short_text' && <span className="text-gray-800">{a.answer_text || '–'}</span>}
                  {a.answer_type === 'single_select' && <span className="badge-blue">{a.answer_select || '–'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments ({attachments.length})</h4>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <a
                key={att.id}
                href={`/api/uploads/${att.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2 py-1 rounded"
              >
                {att.mime_type.startsWith('image/') ? '🖼' : '🎬'} {att.original_name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvaluationHistory() {
  const [searchParams] = useSearchParams();
  const [evals, setEvals] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    student_id: searchParams.get('student_id') || '',
    subject_id: '',
    date_from: '',
    date_to: '',
  });
  const [selectedEval, setSelectedEval] = useState(null);

  useEffect(() => {
    Promise.all([getMyStudents(), getSubjectsWithTemplates()])
      .then(([sRes, subRes]) => {
        setStudents(sRes.data.students);
        setSubjects(subRes.data.subjects);
      }).catch(console.error);
    load();
  }, []);

  const load = async (f = filters) => {
    setLoading(true);
    const params = {};
    if (f.student_id) params.student_id = f.student_id;
    if (f.subject_id) params.subject_id = f.subject_id;
    if (f.date_from) params.date_from = f.date_from;
    if (f.date_to) params.date_to = f.date_to;
    try {
      const r = await getMyEvaluations(params);
      setEvals(r.data.evaluations);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Evaluation History</h1>
        <Link to="/teacher/evaluations/new" className="btn-primary">+ New Evaluation</Link>
      </div>

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Student</label>
            <select className="form-select w-44" value={filters.student_id} onChange={(e) => setFilters((f) => ({ ...f, student_id: e.target.value }))}>
              <option value="">All Students</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.display_name || `${s.first_name} ${s.last_name}`}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <select className="form-select w-36" value={filters.subject_id} onChange={(e) => setFilters((f) => ({ ...f, subject_id: e.target.value }))}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From</label>
            <input type="date" className="form-input w-36" value={filters.date_from} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input type="date" className="form-input w-36" value={filters.date_to} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))} />
          </div>
          <button onClick={() => load(filters)} className="btn-secondary">Filter</button>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card overflow-hidden p-0">
          {!evals.length ? (
            <EmptyState icon="📋" title="No evaluations found" description="No evaluations match your filters." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Date', 'Student', 'Subject', 'Strengths', 'Files', ''].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evals.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEval(e.id)}>
                      <td className="table-cell text-gray-500">{e.evaluation_date?.split('T')[0]}</td>
                      <td className="table-cell font-medium">{e.student_name}</td>
                      <td className="table-cell"><span className="badge-blue">{e.subject_name}</span></td>
                      <td className="table-cell text-gray-500 max-w-xs truncate">{e.strengths_text || '–'}</td>
                      <td className="table-cell">{parseInt(e.attachment_count) > 0 && <span className="badge-gray">📎 {e.attachment_count}</span>}</td>
                      <td className="table-cell text-blue-600 text-xs">View →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={!!selectedEval} onClose={() => setSelectedEval(null)} title="Evaluation Detail" size="lg">
        {selectedEval && <EvalDetail evalId={selectedEval} onClose={() => setSelectedEval(null)} />}
      </Modal>
    </div>
  );
}
