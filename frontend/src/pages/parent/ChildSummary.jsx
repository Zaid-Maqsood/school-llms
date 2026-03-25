import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getMyChild, getChildSummary } from '../../api/parent';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

function TrendBadge({ trend }) {
  const config = {
    improving: { label: '↑ Improving', cls: 'bg-green-100 text-green-700' },
    stable: { label: '→ Stable', cls: 'bg-blue-100 text-blue-700' },
    needs_attention: { label: '↓ Needs Attention', cls: 'bg-orange-100 text-orange-700' },
  };
  const c = config[trend] || config.stable;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

function ScoreBar({ value, max = 5 }) {
  const pct = Math.round((value / max) * 100);
  const color = value >= 4 ? 'bg-green-500' : value >= 3 ? 'bg-blue-500' : value >= 2 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8">{value?.toFixed(1)}</span>
    </div>
  );
}

function SubjectCard({ subject }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900">{subject.subject_name}</h3>
        <TrendBadge trend={subject.trend_status} />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500">Average Score</span>
          <span className="text-xs text-gray-400">{subject.total_evaluations} session{subject.total_evaluations !== 1 ? 's' : ''}</span>
        </div>
        {subject.average_rating != null ? (
          <ScoreBar value={subject.average_rating} />
        ) : (
          <span className="text-sm text-gray-400">No rating data</span>
        )}
      </div>

      {/* Generated Summary */}
      {subject.generated_summary && (
        <div className="p-3 bg-gray-50 rounded-md mb-4">
          <p className="text-sm text-gray-700 leading-relaxed">{subject.generated_summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Strengths */}
        {subject.strengths?.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-green-700 mb-1.5">✓ What they're good at</div>
            <ul className="space-y-1">
              {subject.strengths.map((s, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                  <span className="text-green-500 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Struggles */}
        {subject.struggles?.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-amber-600 mb-1.5">⚠ Areas for growth</div>
            <ul className="space-y-1">
              {subject.struggles.map((s, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                  <span className="text-amber-500 mt-0.5">•</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recent Notes */}
      {subject.recent_notes?.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-1.5">📝 Recent Teacher Notes</div>
          <div className="space-y-1.5">
            {subject.recent_notes.slice(0, 3).map((n, i) => (
              <div key={i} className="text-xs text-gray-600 pl-2 border-l-2 border-blue-200">
                <span className="text-gray-400">{n.date?.split('T')[0]}: </span>{n.note}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChildSummary() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [child, setChild] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const period = searchParams.get('period') || 'weekly';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';

  const [customFrom, setCustomFrom] = useState(dateFrom);
  const [customTo, setCustomTo] = useState(dateTo);

  useEffect(() => {
    getMyChild(id)
      .then((r) => setChild(r.data.child))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    loadSummary();
  }, [id, period, dateFrom, dateTo]);

  const loadSummary = async () => {
    setSummaryLoading(true);
    const params = { period };
    if (period === 'range') { params.from = dateFrom || customFrom; params.to = dateTo || customTo; }
    try {
      const r = await getChildSummary(id, params);
      setSummary(r.data.summary);
      if (r.data.summary?.subjects?.length && !activeTab) {
        setActiveTab(r.data.summary.subjects[0].subject_id);
      }
    } catch (e) { console.error(e); }
    setSummaryLoading(false);
    setLoading(false);
  };

  const changePeriod = (p) => {
    const params = new URLSearchParams({ period: p });
    setSearchParams(params);
  };

  const applyRange = () => {
    setSearchParams({ period: 'range', from: customFrom, to: customTo });
  };

  if (loading) return <LoadingSpinner />;

  const currentSubject = summary?.subjects?.find((s) => s.subject_id === activeTab);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/parent/children" className="text-blue-600 hover:text-blue-800 text-sm">← My Children</Link>
        <span className="text-gray-300">/</span>
        <Link to={`/parent/children/${id}/evaluations`} className="text-blue-600 hover:text-blue-800 text-sm">📋 Reports</Link>
      </div>

      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {child?.display_name || `${child?.first_name} ${child?.last_name}`}'s Summary
          </h1>
          {child?.grade_class && <p className="text-sm text-gray-500">📚 {child.grade_class}</p>}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'weekly', label: 'This Week' },
          { key: 'monthly', label: 'This Month' },
          { key: 'range', label: 'Custom Range' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changePeriod(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {period === 'range' && (
        <div className="card mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="form-label">From</label>
              <input type="date" className="form-input w-36" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div>
              <label className="form-label">To</label>
              <input type="date" className="form-input w-36" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
            <button onClick={applyRange} disabled={!customFrom || !customTo} className="btn-primary">Apply</button>
          </div>
        </div>
      )}

      {summary && (
        <div className="text-sm text-gray-500 mb-4">
          Showing data from <strong>{summary.period_from}</strong> to <strong>{summary.period_to}</strong>
        </div>
      )}

      {summaryLoading ? (
        <LoadingSpinner message="Generating summary..." />
      ) : !summary?.subjects?.length ? (
        <EmptyState
          icon="📊"
          title="No data for this period"
          description="There are no evaluations recorded during this time period. Try selecting a different range."
        />
      ) : (
        <div>
          {/* Subject Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {summary.subjects.map((s) => (
              <button
                key={s.subject_id}
                onClick={() => setActiveTab(s.subject_id)}
                className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === s.subject_id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.subject_name}
                {s.average_rating && (
                  <span className={`ml-1.5 text-xs ${activeTab === s.subject_id ? 'text-blue-200' : 'text-gray-400'}`}>
                    ★{s.average_rating?.toFixed(1)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* All subjects grid or single subject */}
          {currentSubject ? (
            <SubjectCard subject={currentSubject} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.subjects.map((s) => <SubjectCard key={s.subject_id} subject={s} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
