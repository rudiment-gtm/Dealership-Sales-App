const express = require('express');
const router = express.Router();
const { db, updateLeadPriorityScore } = require('../database');

// GET activities for a lead
router.get('/', (req, res) => {
  const { lead_id, rep_id } = req.query;

  let query = `
    SELECT a.*, sr.name as rep_name,
      l.first_name, l.last_name
    FROM activities a
    JOIN sales_reps sr ON a.sales_rep_id = sr.id
    JOIN leads l ON a.lead_id = l.id
    WHERE 1=1
  `;
  const params = [];

  if (lead_id) {
    query += ' AND a.lead_id = ?';
    params.push(lead_id);
  }
  if (rep_id) {
    query += ' AND a.sales_rep_id = ?';
    params.push(rep_id);
  }

  query += ' ORDER BY a.created_at DESC LIMIT 100';

  const activities = db.prepare(query).all(...params);
  res.json(activities);
});

// POST log an activity
router.post('/', (req, res) => {
  const { lead_id, sales_rep_id, type, notes } = req.body;

  if (!lead_id || !sales_rep_id || !type) {
    return res.status(400).json({ error: 'lead_id, sales_rep_id, and type are required' });
  }

  const validTypes = ['call', 'email', 'text', 'visit', 'note', 'status_change'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
  }

  const result = db.prepare(`
    INSERT INTO activities (lead_id, sales_rep_id, type, notes)
    VALUES (?, ?, ?, ?)
  `).run(lead_id, sales_rep_id, type, notes || null);

  // Update last contacted date for contact activities
  if (['call', 'email', 'text', 'visit'].includes(type)) {
    db.prepare(`
      UPDATE leads SET
        last_contacted_date = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(lead_id);

    updateLeadPriorityScore(lead_id);
  }

  const activity = db.prepare(`
    SELECT a.*, sr.name as rep_name FROM activities a
    JOIN sales_reps sr ON a.sales_rep_id = sr.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(activity);
});

module.exports = router;
