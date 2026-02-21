const express = require('express');
const router = express.Router();
const { db } = require('../database');

// GET all sales reps
router.get('/', (req, res) => {
  const reps = db.prepare('SELECT * FROM sales_reps ORDER BY name').all();
  res.json(reps);
});

// GET single rep
router.get('/:id', (req, res) => {
  const rep = db.prepare('SELECT * FROM sales_reps WHERE id = ?').get(req.params.id);
  if (!rep) return res.status(404).json({ error: 'Sales rep not found' });
  res.json(rep);
});

// POST create rep
router.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  try {
    const result = db.prepare('INSERT INTO sales_reps (name, email) VALUES (?, ?)').run(name, email);
    const rep = db.prepare('SELECT * FROM sales_reps WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(rep);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET stats for a rep
router.get('/:id/stats', (req, res) => {
  const repId = req.params.id;
  const now = new Date().toISOString().split('T')[0];

  const totalLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE sales_rep_id = ? AND status NOT IN ('won','lost')").get(repId);
  const todayFollowups = db.prepare(`
    SELECT COUNT(*) as count FROM followups
    WHERE sales_rep_id = ? AND date(scheduled_date) = date('now') AND completed = 0
  `).get(repId);
  const overdueFollowups = db.prepare(`
    SELECT COUNT(*) as count FROM followups
    WHERE sales_rep_id = ? AND date(scheduled_date) < date('now') AND completed = 0
  `).get(repId);
  const wonThisMonth = db.prepare(`
    SELECT COUNT(*) as count FROM leads
    WHERE sales_rep_id = ? AND status = 'won' AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
  `).get(repId);

  res.json({
    activeLeads: totalLeads.count,
    todayFollowups: todayFollowups.count,
    overdueFollowups: overdueFollowups.count,
    wonThisMonth: wonThisMonth.count,
  });
});

module.exports = router;
