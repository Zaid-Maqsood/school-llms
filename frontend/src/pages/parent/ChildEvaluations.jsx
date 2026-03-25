import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyChild, getChildEvaluations, getChildEvaluationDetail } from '../../api/parent';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

function EvalDetail({ childId, evalId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChildEvaluationDetail(childId, evalId)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [childId, evalId]);

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { evaluation, answers, attachments } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="text-gray-500">Subject:</span> <strong>{evaluation.subject_name}</strong></div>
        <div><span className="text-gray-500">Date:</span> {evaluation.evaluation_date?.split('T')[0]}</div>
        <div><span className="text-gray-500">Teacher:</span> {evaluation.teacher_name}</div>
      </div>

      {evaluation.strengths_text && (
        <div className="p-3 bg-green-50 border border-green-100 rounded-md">
          <div className="text-xs font-semibold text-green-700 mb-1">✓ Strengths Observed</div>
          <p className="text-sm text-green-800">{evaluation.strengths_text}</p>
        </div>
      )}
      {evaluation.struggles_text && (
        <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
          <div className="text-xs font-semibold text-amber-700 mb-1">⚠ Areas for Growth</div>
          <p className="text-sm text-amber-800">{evaluation.struggles_text}</p>
        </div>
      )}
      {evaluation.general_notes && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
          <div className="text-xs font-semibold text-blue-700 mb-1">📝 Teacher Notes</div>
          <p className="text-sm text-blue-800">{evaluation.general_notes}</p>
        </div>
      )}

      {answers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Evaluation Responses</h4>
          <div className="space-y-2">
            {answers.map((a, i) => (
              <div key={i} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                <div className="text-gray-500 text-xs">{a.prompt}</div>
                <div className="font-medium mt-0.5">
                  {a.answer_type === 'rating' && a.answer_rating != null && (
                    <span className="flex gap-0.5 items-center">
                      {[1,2,3,4,5].map((n) => (
                        <span key={n} className={`text-base ${n <= a.answer_rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                      <span className="text-gray-500 text-xs ml-1">{a.answer_rating}/5</span>
                    </span>
                  )}
                  {a.answer_type === 'yes_no' && (
                    <span className={a.answer_yes_no ? 'text-green-600' : 'text-red-500'}>{a.answer_yes_no ? '✓ Yes' : '✗ No'}</span>
                  )}
                  {a.answer_type === 'short_text' && <span className="text-gray-700">{a.answer_text || '–'}</span>}
                  {a.answer_type === 'single_select' && <span className="badge-blue">{a.answer_select || '–'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Attachments</h4>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <a
                key={att.id}
                href={`/api/uploads/${att.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-2 py-1"
              >
                {att.mime_type?.startsWith('image/') ? '🖼' : '🎬'} {att.original_name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChildEvaluations() {
  const { id } = useParams();
  const [child, setChild] = useState(null);
  const [evals, setEvals] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subject_id: '', date_from: '', date_to: '' });
  const [selectedEval, setSelectedEval] = useState(null);

  useEffect(() => {
    Promise.all([
      getMyChild(id),
      getChildEvaluations(id),
    ]).then(([childRes, evalsRes]) => {
      setChild(childRes.data.child);
      setSubjects(childRes.data.subjects);
      setEvals(evalsRes.data.evaluations);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [id]);

  const loadEvals = async (f = filters) => {
    const params = {};
    if (f.subject_id) params.subject_id = f.subject_id;
    if (f.date_from) params.date_from = f.date_from;
    if (f.date_to) params.date_to = f.date_to;
    try {
      const r = await getChildEvaluations(id, params);
      setEvals(r.data.evaluations);
    } catch (e) { console.error(e); }
  };

  if (loading) return <LoadingSpinner />;
  if (!child) return <div className="text-red-600">Not found</div>;

  const subjectColors = ['badge-blue', 'badge-green', 'badge-yellow', 'badge-gray', 'badge-red'];
  const subjectColorMap = {};
  subjects.forEach((s, i) => { subjectColorMap[s.id] = subjectColors[i % subjectColors.length]; });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/parent/children" className="text-blue-600 hover:text-blue-800 text-sm">← My Children</Link>
        <span className="text-gray-300">/</span>
        <Link to={`/parent/children/${id}/summary`} className="text-blue-600 hover:text-blue-800 text-sm">📊 Summary</Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {child.display_name || `${child.first_name} ${child.last_name}`}'s Reports
      </h1>
      {child.grade_class && <p className="text-sm text-gray-500 mb-6">📚 {child.grade_class}</p>}

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Subject</label>
            <select className="form-select w-40" value={filters.subject_id} onChange={(e) => setFilters((f) => ({ ...f, subject_id: e.target.value }))}>
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
          <button onClick={() => loadEvals(filters)} className="btn-secondary">Filter</button>
        </div>
      </div>

      {!evals.length ? (
        <EmptyState icon="📋" title="No evaluations found" description="No evaluation reports match your filters." />
      ) : (
        <div className="space-y-2">
          {evals.map((e) => (
            <div
              key={e.id}
              onClick={() => setSelectedEval(e.id)}
              className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{e.evaluation_date?.split('T')[0]}</span>
                    <span className={`${subjectColorMap[e.subject_id] || 'badge-blue'} text-xs`}>{e.subject_name}</span>
                    {parseInt(e.attachment_count) > 0 && <span className="badge-gray text-xs">📎 {e.attachment_count}</span>}
                  </div>
                  <p className="text-xs text-gray-500">by {e.teacher_name}</p>
                  {e.strengths_text && <p className="text-xs text-green-700 mt-1.5">✓ {e.strengths_text}</p>}
                  {e.struggles_text && <p className="text-xs text-amber-600 mt-0.5">⚠ {e.struggles_text}</p>}
                </div>
                <span className="text-blue-500 text-sm">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selectedEval} onClose={() => setSelectedEval(null)} title="Evaluation Detail" size="lg">
        {selectedEval && <EvalDetail childId={id} evalId={selectedEval} />}
      </Modal>
    </div>
  );
}
