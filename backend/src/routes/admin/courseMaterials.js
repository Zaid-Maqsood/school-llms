const router = require('express').Router();
const path = require('path');
const { query } = require('../../config/db');
const { materialsUpload, UPLOAD_DIR } = require('../../middleware/upload');
const { getFileStream } = require('../../services/storageService');
const { ok, created, notFound, serverError, badRequest } = require('../../utils/response');

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileType = (mime, originalName) => {
  if (!mime) return 'file';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('word')) return 'doc';
  if (mime.includes('powerpoint') || mime.includes('presentation')) return 'ppt';
  if (mime.includes('excel') || mime.includes('sheet')) return 'xls';
  return 'file';
};

// GET /api/admin/course-materials — all root folders with children + files
router.get('/', async (req, res) => {
  try {
    const rootFolders = await query(`SELECT * FROM course_folders WHERE parent_id IS NULL ORDER BY created_at`);
    const subFolders = await query(`SELECT * FROM course_folders WHERE parent_id IS NOT NULL ORDER BY created_at`);
    const files = await query(`SELECT * FROM course_files ORDER BY created_at`);

    const filesByFolder = {};
    for (const f of files.rows) {
      if (!filesByFolder[f.folder_id]) filesByFolder[f.folder_id] = [];
      filesByFolder[f.folder_id].push({ ...f, file_size: formatSize(f.file_size) });
    }

    const subsByParent = {};
    for (const s of subFolders.rows) {
      if (!subsByParent[s.parent_id]) subsByParent[s.parent_id] = [];
      subsByParent[s.parent_id].push({ ...s, files: filesByFolder[s.id] || [] });
    }

    const result = rootFolders.rows.map(f => ({
      ...f,
      children: subsByParent[f.id] || [],
    }));

    return ok(res, { folders: result });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/course-materials/folders — create root or sub folder
router.post('/folders', async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    if (!name?.trim()) return badRequest(res, 'name is required');
    const r = await query(
      `INSERT INTO course_folders (name, parent_id, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), parent_id || null, req.user.id]
    );
    return created(res, { folder: { ...r.rows[0], files: [], children: [] } });
  } catch (err) {
    return serverError(res, err);
  }
});

// POST /api/admin/course-materials/folders/:id/files — upload file
router.post('/folders/:id/files', materialsUpload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const folderCheck = await query('SELECT id FROM course_folders WHERE id = $1', [id]);
    if (!folderCheck.rows.length) return notFound(res, 'Folder not found');

    const { video_url } = req.body;

    if (video_url) {
      // YouTube embed
      const r = await query(
        `INSERT INTO course_files (folder_id, original_name, file_name, file_type, video_url, uploaded_by)
         VALUES ($1, $2, $3, 'video', $4, $5) RETURNING *`,
        [id, req.body.name || 'Video', '', video_url, req.user.id]
      );
      return created(res, { file: r.rows[0] });
    }

    if (!req.file) return badRequest(res, 'File is required');

    const fileType = getFileType(req.file.mimetype, req.file.originalname);
    const r = await query(
      `INSERT INTO course_files (folder_id, original_name, file_name, file_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, req.file.originalname, req.file.filename, fileType, req.file.size, req.user.id]
    );
    return created(res, { file: { ...r.rows[0], file_size: formatSize(r.rows[0].file_size) } });
  } catch (err) {
    return serverError(res, err);
  }
});

// GET /api/admin/course-materials/files/:id/download
router.get('/files/:id/download', async (req, res) => {
  try {
    const r = await query('SELECT * FROM course_files WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return notFound(res, 'File not found');
    const file = r.rows[0];
    const stream = getFileStream(file.file_name);
    if (!stream) return notFound(res, 'File not found on disk');
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    stream.pipe(res);
  } catch (err) {
    return serverError(res, err);
  }
});

// DELETE /api/admin/course-materials/files/:id
router.delete('/files/:id', async (req, res) => {
  try {
    const r = await query('SELECT * FROM course_files WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return notFound(res, 'File not found');
    if (r.rows[0].file_name) {
      const { deleteFile } = require('../../services/storageService');
      deleteFile(r.rows[0].file_name);
    }
    await query('DELETE FROM course_files WHERE id = $1', [req.params.id]);
    return ok(res, { message: 'Deleted' });
  } catch (err) {
    return serverError(res, err);
  }
});

// DELETE /api/admin/course-materials/folders/:id
router.delete('/folders/:id', async (req, res) => {
  try {
    await query('DELETE FROM course_folders WHERE id = $1', [req.params.id]);
    return ok(res, { message: 'Deleted' });
  } catch (err) {
    return serverError(res, err);
  }
});

module.exports = router;
