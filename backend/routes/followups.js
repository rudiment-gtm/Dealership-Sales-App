const express = require('express');
const router = express.Router();
const { db, updateLeadPriorityScore } = require('../database');

// GET follow-ups (queue view - sorted by urgency)
router.get('/', (req, res) => {
  const { rep_id, date, completed } = req.query;

  let query = `
    SELECT f.*,
      l.first_name, l.last_name, l.phone, l.email,
      l.vehicle_interest, l.vehicle_type, l.status as lead_status,
      l.priority_score,
      sr.name as rep_name
    FROM followups f
    JOIN leads l ON f.lead_id = l.id
    JOIN sales_reps sr ON f.sales_rep_id = sr.id
    WHERE 1=1
  `;
  const params = [];

  if (rep_id) {
    query += ' AND f.sales_rep_id = ?';
    params.push(rep_id);
  }
  if (date) {
    query += ' AND date(f.scheduled_date) = date(?)';
    params.push(date);
  }
  if (completed !== undefined) {
    query += ' AND f.completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }

  query += ' ORDER BY f.scheduled_date ASC, l.priority_score DESC';

  const followups = db.prepare(query).all(...params);
  res.json(followups);
});

// GET today's follow-up queue
router.get('/today', (req, res) => {
  const { rep_id } = req.query;

  let query = `
    SELECT f.*,
      l.first_name, l.last_name, l.phone, l.email,
      l.vehicle_interest, l.vehicle_type, l.status as lead_status,
      l.priority_score, l.last_contacted_date,
      sr.name as rep_name
    FROM followups f
    JOIN leads l ON f.lead_id = l.id
    JOIN sales_reps sr ON f.sales_rep_id = sr.id
    WHERE f.completed = 0
      AND (date(f.scheduled_date) <= date('now'))
  `;
  const params = [];

  if (rep_id) {
    query += ' AND f.sales_rep_id = ?';
    params.push(rep_id);
  }

  query += ' ORDER BY f.scheduled_date ASC, l.priority_score DESC';

  const followups = db.prepare(query).all(...params);
  res.json(followups);
});

// GET upcoming follow-ups (next 7 days)
router.get('/upcoming', (req, res) => {
  const { rep_id } = req.query;

  let query = `
    SELECT f.*,
      l.first_name, l.last_name, l.phone, l.email,
      l.vehicle_interest, l.vehicle_type, l.status as lead_status,
      l.priority_score,
      sr.name as rep_name
    FROM followups f
    JOIN leads l ON f.lead_id = l.id
    JOIN sales_reps sr ON f.sales_rep_id = sr.id
    WHERE f.completed = 0
      AND date(f.scheduled_date) > date('now')
      AND date(f.scheduled_date) <= date('now', '+7 days')
  `;
  const params = [];

  if (rep_id) {
    query += ' AND f.sales_rep_id = ?';
    params.push(rep_id);
  }

  query += ' ORDER BY f.scheduled_date ASC';

  const followups = db.prepare(query).all(...params);
  res.json(followups);
});

// POST create follow-up
router.post('/', (req, res) => {
  const { lead_id, sales_rep_id, scheduled_date, type, notes } = req.body;

  if (!lead_id || !sales_rep_id || !scheduled_date) {
    return res.status(400).json({ error: 'lead_id, sales_rep_id, and scheduled_date are required' });
  }

  const result = db.prepare(`
    INSERT INTO followups (lead_id, sales_rep_id, scheduled_date, type, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(lead_id, sales_rep_id, scheduled_date, type || 'call', notes || null);

  // Update lead's next_followup_date to earliest pending followup
  db.prepare(`
    UPDATE leads SET
      next_followup_date = (
        SELECT MIN(scheduled_date) FROM followups
        WHERE lead_id = ? AND completed = 0
      ),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(lead_id, lead_id);

  updateLeadPriorityScore(lead_id);

  const followup = db.prepare(`
    SELECT f.*, l.first_name, l.last_name FROM followups f
    JOIN leads l ON f.lead_id = l.id
    WHERE f.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(followup);
});

// PUT complete a follow-up
router.put('/:id/complete', (req, res) => {
  const { outcome, notes, next_followup_date, next_followup_type } = req.body;
  const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(req.params.id);
  if (!followup) return res.status(404).json({ error: 'Follow-up not found' });

  db.prepare(`
    UPDATE followups SET
      completed = 1,
      completed_at = datetime('now'),
      outcome = ?,
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(outcome || null, notes || null, req.params.id);

  // Update lead's last contacted date
  db.prepare(`
    UPDATE leads SET
      last_contacted_date = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(followup.lead_id);

  // Log activity
  db.prepare(`
    INSERT INTO activities (lead_id, sales_rep_id, type, notes)
    VALUES (?, ?, ?, ?)
  `).run(
    followup.lead_id,
    followup.sales_rep_id,
    followup.type,
    `Follow-up completed. ${outcome ? 'Outcome: ' + outcome : ''} ${notes ? '| Notes: ' + notes : ''}`
  );

  // Schedule next follow-up if provided
  if (next_followup_date) {
    db.prepare(`
      INSERT INTO followups (lead_id, sales_rep_id, scheduled_date, type)
      VALUES (?, ?, ?, ?)
    `).run(followup.lead_id, followup.sales_rep_id, next_followup_date, next_followup_type || 'call');
  }

  // Update lead's next_followup_date
  db.prepare(`
    UPDATE leads SET
      next_followup_date = (
        SELECT MIN(scheduled_date) FROM followups
        WHERE lead_id = ? AND completed = 0
      )
    WHERE id = ?
  `).run(followup.lead_id, followup.lead_id);

  updateLeadPriorityScore(followup.lead_id);

  res.json({ message: 'Follow-up marked complete' });
});

// DELETE follow-up
router.delete('/:id', (req, res) => {
  const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(req.params.id);
  if (!followup) return res.status(404).json({ error: 'Follow-up not found' });

  db.prepare('DELETE FROM followups WHERE id = ?').run(req.params.id);

  // Recalculate next followup date for the lead
  db.prepare(`
    UPDATE leads SET
      next_followup_date = (
        SELECT MIN(scheduled_date) FROM followups
        WHERE lead_id = ? AND completed = 0
      ),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(followup.lead_id, followup.lead_id);

  updateLeadPriorityScore(followup.lead_id);
  res.json({ message: 'Follow-up deleted' });
});

module.exports = router;
