const express = require('express');
const { pool } = require('../db');

const router = express.Router();
const VALID_STATUSES = new Set(['Pending', 'In progress', 'Completed']);

function validateId(rawId) {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateRecord(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const fields = ['title', 'category', 'description', 'status'];
  const values = {};

  for (const field of fields) {
    if (typeof body[field] !== 'string') {
      return { error: `${field} must be a string.` };
    }
    values[field] = body[field].trim();
    if (!values[field]) {
      return { error: `${field} cannot be blank.` };
    }
  }

  if (values.title.length < 3 || values.title.length > 80) {
    return { error: 'title must contain between 3 and 80 characters.' };
  }
  if (values.category.length < 2 || values.category.length > 40) {
    return { error: 'category must contain between 2 and 40 characters.' };
  }
  if (values.description.length < 5 || values.description.length > 300) {
    return { error: 'description must contain between 5 and 300 characters.' };
  }
  if (!VALID_STATUSES.has(values.status)) {
    return { error: 'status must be exactly Pending, In progress, or Completed.' };
  }

  return { values };
}

// GET /api/records - return every record.
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, title, category, description, status, created_at, updated_at FROM records ORDER BY id ASC'
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id - return one record.
router.get('/:id', async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });

    const result = await pool.query(
      'SELECT id, title, category, description, status, created_at, updated_at FROM records WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Record not found.' });

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records - create a record; client-supplied IDs are ignored.
router.post('/', async (req, res, next) => {
  try {
    const { values, error } = validateRecord(req.body);
    if (error) return res.status(400).json({ message: error });

    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category, description, status, created_at, updated_at`,
      [values.title, values.category, values.description, values.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id - replace the editable fields of an existing record.
router.put('/:id', async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });

    const { values, error } = validateRecord(req.body);
    if (error) return res.status(400).json({ message: error });

    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, title, category, description, status, created_at, updated_at`,
      [values.title, values.category, values.description, values.status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: 'Record not found.' });

    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id - delete an existing record.
router.delete('/:id', async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID must be a positive whole number.' });

    const result = await pool.query('DELETE FROM records WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: 'Record not found.' });

    res.status(200).json({ message: 'Record deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;