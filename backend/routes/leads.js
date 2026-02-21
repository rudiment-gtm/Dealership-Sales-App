const express = require('express');
const router = express.Router();
const { db, updateLeadPriorityScore } = require('../database');

// GET all leads (with optional filters)
router.get('/', (req, res) => {
  const { rep_id, status, sort = 'priority_score', order = 'DESC' } = req.query;

  const validSorts = ['priority_score', 'created_at', 'updated_at', 'next_followup_date', 'last_contacted_date'];
  const validOrders = ['ASC', 'DESC'];
  const safeSort = validSorts.includes(sort) ? sort : 'priority_score';
  const safeOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

  let query = `
    SELECT l.*, sr.name as rep_name,
      (SELECT COUNT(*) FROM followups f WHERE f.lead_id = l.id AND f.completed = 0) as pending_followups,
      (SELECT COUNT(*) FROM followups f WHERE f.lead_id = l.id AND f.completed = 0 AND date(f.scheduled_date) < date('now')) as overdue_followups
    FROM leads l
    JOIN sales_reps sr ON l.sales_rep_id = sr.id
    WHERE 1=1
  `;
  const params = [];

  if (rep_id) {
    query += ' AND l.sales_rep_id = ?';
    params.push(rep_id);
  }
  if (status) {
    query += ' AND l.status = ?';
    params.push(status);
  }

  query += ` ORDER BY l.${safeSort} ${safeOrder}`;

  const leads = db.prepare(query).all(...params);
  res.json(leads);
});

// GET single lead with full details
router.get('/:id', (req, res) => {
  const lead = db.prepare(`
    SELECT l.*, sr.name as rep_name
    FROM leads l
    JOIN sales_reps sr ON l.sales_rep_id = sr.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const followups = db.prepare(`
    SELECT f.*, sr.name as rep_name
    FROM followups f
    JOIN sales_reps sr ON f.sales_rep_id = sr.id
    WHERE f.lead_id = ?
    ORDER BY f.scheduled_date ASC
  `).all(req.params.id);

  const activities = db.prepare(`
    SELECT a.*, sr.name as rep_name
    FROM activities a
    JOIN sales_reps sr ON a.sales_rep_id = sr.id
    WHERE a.lead_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  res.json({ ...lead, followups, activities });
});

// POST create lead
router.post('/', (req, res) => {
  const {
    first_name, last_name, email, phone,
    vehicle_interest, vehicle_type, budget,
    source, status, notes, sales_rep_id,
    next_followup_date
  } = req.body;

  if (!first_name || !last_name || !sales_rep_id) {
    return res.status(400).json({ error: 'first_name, last_name, and sales_rep_id are required' });
  }

  const result = db.prepare(`
    INSERT INTO leads (
      first_name, last_name, email, phone,
      vehicle_interest, vehicle_type, budget,
      source, status, notes, sales_rep_id, next_followup_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    first_name, last_name, email || null, phone || null,
    vehicle_interest || null, vehicle_type || null, budget || null,
    source || 'walk-in', status || 'new', notes || null, sales_rep_id,
    next_followup_date || null
  );

  const leadId = result.lastInsertRowid;

  // Log activity
  db.prepare(`
    INSERT INTO activities (lead_id, sales_rep_id, type, notes)
    VALUES (?, ?, 'note', 'Lead created')
  `).run(leadId, sales_rep_id);

  updateLeadPriorityScore(leadId);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  res.status(201).json(lead);
});

// PUT update lead
router.put('/:id', (req, res) => {
  const leadId = req.params.id;
  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!existing) return res.status(404).json({ error: 'Lead not found' });

  const {
    first_name, last_name, email, phone,
    vehicle_interest, vehicle_type, budget,
    source, status, notes, next_followup_date,
    last_contacted_date, sales_rep_id
  } = req.body;

  // Track status change
  if (status && status !== existing.status) {
    const repId = sales_rep_id || existing.sales_rep_id;
    db.prepare(`
      INSERT INTO activities (lead_id, sales_rep_id, type, notes)
      VALUES (?, ?, 'status_change', ?)
    `).run(leadId, repId, `Status changed from "${existing.status}" to "${status}"`);
  }

  db.prepare(`
    UPDATE leads SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      vehicle_interest = COALESCE(?, vehicle_interest),
      vehicle_type = COALESCE(?, vehicle_type),
      budget = COALESCE(?, budget),
      source = COALESCE(?, source),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      next_followup_date = COALESCE(?, next_followup_date),
      last_contacted_date = COALESCE(?, last_contacted_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    first_name || null, last_name || null, email || null, phone || null,
    vehicle_interest || null, vehicle_type || null, budget || null,
    source || null, status || null, notes || null,
    next_followup_date || null, last_contacted_date || null,
    leadId
  );

  updateLeadPriorityScore(leadId);

  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  res.json(lead);
});

// DELETE lead
router.delete('/:id', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  db.prepare('DELETE FROM followups WHERE lead_id = ?').run(req.params.id);
  db.prepare('DELETE FROM activities WHERE lead_id = ?').run(req.params.id);
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);

  res.json({ message: 'Lead deleted successfully' });
});

module.exports = router;
