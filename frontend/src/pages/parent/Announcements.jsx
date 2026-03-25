import React, { useState } from 'react';

const mockAnnouncements = [
  { id: 1, title: 'Spring Break Schedule', body: 'School will be closed from April 14–18. Classes resume April 21. Enjoy your break!', type: 'school', author: 'Sarah Mitchell', date: '2026-03-20', pinned: true },
  { id: 2, title: 'Parent-Teacher Conference Day', body: 'Scheduled for March 28. Please check your email for individual time slots with your child\'s teacher.', type: 'school', author: 'Sarah Mitchell', date: '2026-03-18', pinned: true },
  { id: 3, title: 'Math Quiz on Friday', body: 'Reminder: Ethan has a short quiz on addition and subtraction this Friday. Please help him review pages 10–15.', type: 'course', course: 'Math - Grade 3', author: 'James Turner', date: '2026-03-22', pinned: false },
  { id: 4, title: 'Reading Assignment Updated', body: 'The reading assignment due date has been extended to April 2nd.', type: 'course', course: 'Reading - Grade 3', author: 'James Turner', date: '2026-03-21', pinned: false },
  { id: 5, title: 'Fire Drill on Friday', body: 'A fire drill is scheduled for Friday at 10:00 AM.', type: 'school', author: 'Sarah Mitchell', date: '2026-03-12', pinned: false },
];

export default function ParentAnnouncements() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? mockAnnouncements
    : filter === 'School' ? mockAnnouncements.filter(a => a.type === 'school')
    : mockAnnouncements.filter(a => a.type === 'course');

  const pinned = filtered.filter(a => a.pinned);
  const rest = filtered.filter(a => !a.pinned);

  const Card = ({ a }) => (
    <div className={`card ${a.pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {a.pinned && <span className="text-xs text-blue-600 font-medium">📌 Pinned</span>}
        <span className={a.type === 'school' ? 'badge-blue' : 'badge-green'}>
          {a.type === 'school' ? 'School-wide' : a.course}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900">{a.title}</h3>
      <p className="text-sm text-gray-600 mt-2">{a.body}</p>
      <p className="text-xs text-gray-400 mt-2">By {a.author} · {a.date}</p>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <p className="text-sm text-gray-500 mt-1">School and course announcements for your child.</p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['All', 'School', 'Course'].map(opt => (
          <button key={opt} onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === opt ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {opt}
          </button>
        ))}
      </div>

      {pinned.length > 0 && <div className="space-y-3 mb-4">{pinned.map(a => <Card key={a.id} a={a} />)}</div>}
      <div className="space-y-3">
        {rest.map(a => <Card key={a.id} a={a} />)}
        {filtered.length === 0 && <div className="card text-center text-gray-400 py-10">No announcements.</div>}
      </div>
    </div>
  );
}
