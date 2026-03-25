import React, { useState } from 'react';
import Modal from '../../components/Modal';

const FILE_ICONS = { pdf: '📄', video: '🎬', doc: '📝', image: '🖼️', default: '📎' };

const initialFolders = [
  {
    id: 1, name: 'Math - Grade 3', open: true,
    children: [
      {
        id: 11, name: 'Week 1 - Addition', open: true,
        files: [
          { id: 111, name: 'Addition Worksheet.pdf', type: 'pdf', size: '245 KB', date: '2026-03-10' },
          { id: 112, name: 'Intro to Addition.mp4', type: 'video', size: '45 MB', date: '2026-03-10', videoUrl: 'https://www.youtube.com/embed/6mAQpBFEqbE' },
        ],
      },
      {
        id: 12, name: 'Week 2 - Subtraction', open: false,
        files: [
          { id: 121, name: 'Subtraction Practice.pdf', type: 'pdf', size: '180 KB', date: '2026-03-17' },
          { id: 122, name: 'Subtraction Explained.mp4', type: 'video', size: '38 MB', date: '2026-03-17', videoUrl: 'https://www.youtube.com/embed/4wLNs8PGMhQ' },
        ],
      },
    ],
  },
  {
    id: 2, name: 'Reading - Grade 3', open: false,
    children: [
      {
        id: 21, name: 'Chapter 1 - Phonics', open: false,
        files: [
          { id: 211, name: 'Phonics Guide.pdf', type: 'pdf', size: '320 KB', date: '2026-03-12' },
          { id: 212, name: 'Vocabulary List.docx', type: 'doc', size: '95 KB', date: '2026-03-12' },
        ],
      },
    ],
  },
  {
    id: 3, name: 'Science - Grade 4', open: false,
    children: [
      {
        id: 31, name: 'Unit 1 - Earth Science', open: false,
        files: [
          { id: 311, name: 'Earth Layers.pdf', type: 'pdf', size: '410 KB', date: '2026-03-14' },
          { id: 312, name: 'Volcano Experiment.mp4', type: 'video', size: '60 MB', date: '2026-03-14', videoUrl: 'https://www.youtube.com/embed/lAmqsMQG3RM' },
        ],
      },
    ],
  },
];

export default function AdminCourseMaterials() {
  const [folders, setFolders] = useState(initialFolders);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadModal, setUploadModal] = useState(false);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [folderForm, setFolderForm] = useState({ course: '', subfolder: '' });

  const toggleFolder = (folderId, subId = null) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f;
      if (!subId) return { ...f, open: !f.open };
      return { ...f, children: f.children.map(c => c.id === subId ? { ...c, open: !c.open } : c) };
    }));
  };

  const handleAddFolder = (e) => {
    e.preventDefault();
    setFolders(prev => prev.map(f => {
      if (f.name !== folderForm.course) return f;
      return { ...f, open: true, children: [...f.children, { id: Date.now(), name: folderForm.subfolder, open: false, files: [] }] };
    }));
    setNewFolderModal(false);
    setFolderForm({ course: '', subfolder: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Materials</h1>
        <div className="flex gap-2">
          <button onClick={() => setNewFolderModal(true)} className="btn-secondary">+ New Folder</button>
          <button onClick={() => setUploadModal(true)} className="btn-primary">+ Upload File</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Folder Tree */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Folders & Files</h2>
          <div className="space-y-1">
            {folders.map(folder => (
              <div key={folder.id}>
                <button onClick={() => toggleFolder(folder.id)}
                  className="flex items-center gap-2 w-full text-left px-2 py-2 rounded hover:bg-gray-50 font-medium text-gray-800">
                  <span>{folder.open ? '📂' : '📁'}</span>
                  <span className="flex-1">{folder.name}</span>
                  <span className="text-xs text-gray-400">{folder.children.length} folders</span>
                </button>
                {folder.open && (
                  <div className="ml-5 border-l border-gray-200 pl-3 space-y-1 mt-1">
                    {folder.children.map(sub => (
                      <div key={sub.id}>
                        <button onClick={() => toggleFolder(folder.id, sub.id)}
                          className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-gray-50 text-gray-700 text-sm">
                          <span>{sub.open ? '📂' : '📁'}</span>
                          <span className="flex-1">{sub.name}</span>
                          <span className="text-xs text-gray-400">{sub.files.length} files</span>
                        </button>
                        {sub.open && (
                          <div className="ml-5 border-l border-gray-200 pl-3 space-y-1 mt-1">
                            {sub.files.length === 0 && (
                              <p className="text-xs text-gray-400 py-1 px-2">No files yet</p>
                            )}
                            {sub.files.map(file => (
                              <div key={file.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-sm group">
                                <span>{FILE_ICONS[file.type] || FILE_ICONS.default}</span>
                                <span className="flex-1 text-gray-700 truncate">{file.name}</span>
                                <span className="text-xs text-gray-400 hidden group-hover:block">{file.size}</span>
                                {file.type === 'video' && (
                                  <button onClick={() => setSelectedVideo(file)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium">Play</button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Video Player */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Video Player</h2>
          {selectedVideo ? (
            <div>
              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                <span>🎬</span> {selectedVideo.name}
              </p>
              <div className="relative w-full rounded overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button onClick={() => setSelectedVideo(null)}
                className="mt-3 text-sm text-gray-500 hover:text-gray-700">✕ Close video</button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <span className="text-5xl mb-3">🎬</span>
              <p className="text-sm font-medium">No video selected</p>
              <p className="text-xs mt-1">Click Play on any video file</p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Embed YouTube Video</h3>
            <div className="flex gap-2">
              <input className="form-input text-sm" placeholder="Paste YouTube URL..." />
              <button className="btn-primary btn-sm whitespace-nowrap">Embed</button>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal open={uploadModal} onClose={() => setUploadModal(false)} title="Upload File">
        <div className="space-y-4">
          <div>
            <label className="form-label">Course Folder</label>
            <select className="form-select">
              {folders.map(f => <option key={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subfolder</label>
            <select className="form-select">
              {folders[0].children.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 cursor-pointer transition-colors">
              <div className="text-4xl mb-2">📎</div>
              <p className="text-sm text-gray-600 font-medium">Click to browse or drag & drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, MP4, Images — max 50MB</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setUploadModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => setUploadModal(false)} className="btn-primary">Upload</button>
          </div>
        </div>
      </Modal>

      {/* New Folder Modal */}
      <Modal open={newFolderModal} onClose={() => setNewFolderModal(false)} title="New Subfolder">
        <form onSubmit={handleAddFolder} className="space-y-4">
          <div>
            <label className="form-label">Course</label>
            <select className="form-select" required value={folderForm.course} onChange={e => setFolderForm(f => ({ ...f, course: e.target.value }))}>
              <option value="">Select course...</option>
              {folders.map(f => <option key={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subfolder Name</label>
            <input className="form-input" required value={folderForm.subfolder} onChange={e => setFolderForm(f => ({ ...f, subfolder: e.target.value }))} placeholder="e.g. Week 3 - Fractions" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setNewFolderModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Folder</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
