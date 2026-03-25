/**
 * Storage Service
 * V1: local filesystem storage.
 * To swap in cloud storage (S3, GCS), replace getFileStream and deleteFile
 * with provider-specific implementations and update STORAGE_PROVIDER env var.
 */
const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../middleware/upload');

const getFilePath = (fileName) => path.join(UPLOAD_DIR, fileName);

const fileExists = (fileName) => fs.existsSync(getFilePath(fileName));

const getFileStream = (fileName) => {
  const filePath = getFilePath(fileName);
  if (!fs.existsSync(filePath)) return null;
  return fs.createReadStream(filePath);
};

const deleteFile = (fileName) => {
  const filePath = getFilePath(fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = { getFilePath, fileExists, getFileStream, deleteFile };
