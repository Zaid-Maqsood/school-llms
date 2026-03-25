import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, createQuestion, getSubjects, getTemplate } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';

const ANSWER_TYPES = [
  { value: 'rating', label: 'Rating (1–5)' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'short_text', label: 'Short Text' },
  { value: 'single_select', label: 'Single Select' },
];

function QuestionForm({ templateId, onSaved }) {
  const [form, setForm] = useState({ prompt: '', answer_type: 'rating', required: true, sort_order: 0, options_json: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (form.answer_type === 'single_select') {
        const opts = form.options_json.split('\n').map((s) => s.trim()).filter(Boolean);
        if (!opts.length) { setError('Enter at least one option per line'); setLoading(false); return; }
        payload.options_json = opts;
      } else {
        payload.options_json = null;
      }
      await createQuestion(templateId, payload);
      onSaved();
      setForm({ prompt: '', answer_type: 'rating', required: true, sort_order: form.sort_order + 1, options_json: '' });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to add question');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-50 rounded-md">
      {error && <div className="p-2 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      <div>
        <label className="form-label text-xs">Question Prompt *</label>
        <input className="form-input" required value={form.prompt} onChange={(e) => set('prompt', e.target.value)} placeholder="e.g. How well did the student understand today's concept?" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="form-label text-xs">Answer Type</label>
          <select className="form-select" value={form.answer_type} onChange={(e) => set('answer_type', e.target.value)}>
            {ANSWER_TYPES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label text-xs">Required</label>
          <select className="form-select" value={form.required ? 'true' : 'false'} onChange={(e) => set('required', e.target.value === 'true')}>
            <option value="true">Required</option>
            <option value="false">Optional</option>
          </select>
        </div>
        <div>
          <label className="form-label text-xs">Sort Order</label>
          <input type="number" className="form-input" value={form.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value))} />
        </div>
      </div>
      {form.answer_type === 'single_select' && (
        <div>
          <label className="form-label text-xs">Options (one per line)</label>
          <textarea className="form-textarea" rows={3} value={form.options_json} onChange={(e) => set('options_json', e.target.value)} placeholder="Option A&#10;Option B&#10;Option C" />
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary btn-sm">
        {loading ? 'Adding...' : '+ Add Question'}
      </button>
    </form>
  );
}

function TemplateDetail({ templateId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try { const r = await getTemplate(templateId); setData(r.data.template); setEditStatus(r.data.template.status); }
    catch (e) { console.error(e); setError(e.response?.data?.error || 'Failed to load template. Please try again.'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [templateId]);

  const handleStatusChange = async () => {
    setStatusLoading(true);
    try { await updateTemplate(templateId, { status: editStatus }); await load(); }
    catch (e) { alert(e.response?.data?.error || 'Failed to update'); }
    finally { setStatusLoading(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div>
      <button onClick={onBack} className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1">← Back to Templates</button>
      <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
    </div>
  );
  if (!data) return null;

  const typeLabel = { rating: '⭐ Rating', yes_no: '✅ Yes/No', short_text: '📝 Text', single_select: '🔘 Select' };

  return (
    <div>
      <button onClick={onBack} className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1">← Back to Templates</button>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{data.name}</h2>
          <p className="text-sm text-gray-500">Subject: {data.subject_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="form-select w-32" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleStatusChange} disabled={statusLoading} className="btn-secondary btn-sm">Save</button>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Questions ({data.questions?.length || 0})</h3>
        {data.questions?.length ? (
          <div className="space-y-2">
            {data.questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                <span className="text-gray-400 text-sm font-medium w-6 text-center">{i + 1}</span>
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{q.prompt}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-500">{typeLabel[q.answer_type]}</span>
                    <span className={`text-xs ${q.required ? 'text-red-500' : 'text-gray-400'}`}>
                      {q.required ? 'Required' : 'Optional'}
                    </span>
                    {q.options_json && <span className="text-xs text-gray-400">{(Array.isArray(q.options_json) ? q.options_json : JSON.parse(q.options_json))?.length} options</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No questions yet. Add your first question below.</p>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Add Question</h3>
        <QuestionForm templateId={templateId} onSaved={load} />
      </div>
    </div>
  );
}

function TemplateForm({ subjects, onSubmit, loading, error }) {
  const [form, setForm] = useState({ subject_id: subjects[0]?.id || '', name: '', status: 'active' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}
      <div>
        <label className="form-label">Subject *</label>
        <select className="form-select" required value={form.subject_id} onChange={(e) => set('subject_id', e.target.value)}>
          <option value="">Select subject...</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Template Name *</label>
        <input className="form-input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Math Daily Evaluation" />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create Template'}</button>
      </div>
    </form>
  );
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState({ open: false });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [tRes, sRes] = await Promise.all([getTemplates(), getSubjects()]);
      setTemplates(tRes.data.templates);
      setSubjects(sRes.data.subjects.filter((s) => s.status === 'active'));
    } catch (e) {
      console.error(e);
      setLoadError(e.response?.data?.error || 'Failed to load templates. Please refresh the page.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (detail) return <TemplateDetail templateId={detail} onBack={() => { setDetail(null); load(); }} />;

  const handleSubmit = async (form) => {
    setFormLoading(true); setFormError('');
    try { const r = await createTemplate(form); setModal({ open: false }); setDetail(r.data.template.id); }
    catch (e) { setFormError(e.response?.data?.error || 'Failed to create'); }
    finally { setFormLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Evaluation Templates</h1>
        <button onClick={() => { setModal({ open: true }); setFormError(''); }} className="btn-primary">+ Create Template</button>
      </div>

      {loading ? <LoadingSpinner /> : loadError ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">{loadError}</div>
      ) : (
        <div className="card overflow-hidden p-0">
          {!templates.length ? (
            <EmptyState icon="📋" title="No templates yet" description="Create evaluation templates for teachers to use." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>{['Template', 'Subject', 'Status', 'Created', 'Actions'].map((h) => <th key={h} className="table-header">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{t.name}</td>
                      <td className="table-cell text-gray-500">{t.subject_name}</td>
                      <td className="table-cell"><span className={t.status === 'active' ? 'badge-green' : 'badge-red'}>{t.status}</span></td>
                      <td className="table-cell text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="table-cell">
                        <button onClick={() => setDetail(t.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit / Questions</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title="Create Template">
        <TemplateForm subjects={subjects} onSubmit={handleSubmit} loading={formLoading} error={formError} />
      </Modal>
    </div>
  );
}
