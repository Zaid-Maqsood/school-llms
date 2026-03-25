const ok = (res, data, status = 200) => res.status(status).json(data);
const created = (res, data) => res.status(201).json(data);
const noContent = (res) => res.status(204).send();
const badRequest = (res, message) => res.status(400).json({ error: message });
const notFound = (res, message = 'Resource not found') => res.status(404).json({ error: message });
const forbidden = (res, message = 'Access denied') => res.status(403).json({ error: message });
const conflict = (res, message) => res.status(409).json({ error: message });
const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { ok, created, noContent, badRequest, notFound, forbidden, conflict, serverError };
