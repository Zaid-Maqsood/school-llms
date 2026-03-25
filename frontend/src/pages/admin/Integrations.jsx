import React, { useState } from 'react';

const ALL_INTEGRATIONS = [
  { id: 1, name: 'Google Classroom', icon: '🎓', desc: 'Sync courses, assignments and grades with Google Classroom.', connected: true, category: 'LMS' },
  { id: 2, name: 'Zoom', icon: '📹', desc: 'Schedule and launch video lessons directly from the portal.', connected: true, category: 'Video' },
  { id: 3, name: 'YouTube', icon: '▶️', desc: 'Embed YouTube videos as course materials.', connected: false, category: 'Video' },
  { id: 4, name: 'Microsoft Teams', icon: '💼', desc: 'Host virtual classes and collaborate via Teams.', connected: false, category: 'Video' },
  { id: 5, name: 'Google Drive', icon: '💾', desc: 'Import and export course materials from Google Drive.', connected: false, category: 'Storage' },
  { id: 6, name: 'Dropbox', icon: '📦', desc: 'Sync uploaded files with your Dropbox account.', connected: false, category: 'Storage' },
  { id: 7, name: 'Stripe', icon: '💳', desc: 'Accept payments for courses and materials.', connected: false, category: 'Payments' },
  { id: 8, name: 'Slack', icon: '💬', desc: 'Send notifications and updates to Slack channels.', connected: false, category: 'Communication' },
  { id: 9, name: 'Zapier', icon: '⚡', desc: 'Automate workflows by connecting with 5000+ apps.', connected: false, category: 'Automation' },
  { id: 10, name: 'Canvas LMS', icon: '🖼️', desc: 'Two-way sync with Canvas learning management system.', connected: false, category: 'LMS' },
  { id: 11, name: 'Twilio', icon: '📱', desc: 'Send SMS notifications to parents and teachers.', connected: false, category: 'Communication' },
  { id: 12, name: 'SendGrid', icon: '📧', desc: 'Send transactional emails for assignments and announcements.', connected: true, category: 'Communication' },
];

export default function AdminIntegrations() {
  const [integrations, setIntegrations] = useState(ALL_INTEGRATIONS);
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...new Set(ALL_INTEGRATIONS.map(i => i.category))];
  const connectedCount = integrations.filter(i => i.connected).length;

  const toggle = (id) => setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));

  const filtered = filter === 'All' ? integrations : integrations.filter(i => i.category === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">API Integrations</h1>
        <span className="badge-blue">{connectedCount} connected</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">Connect your school portal with third-party tools and services.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900">{item.name}</div>
                  <span className="text-xs text-gray-400">{item.category}</span>
                </div>
              </div>
              <span className={item.connected ? 'badge-green' : 'badge-gray'}>
                {item.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <p className="text-sm text-gray-500 flex-1">{item.desc}</p>
            <button onClick={() => toggle(item.id)}
              className={item.connected ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}>
              {item.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
