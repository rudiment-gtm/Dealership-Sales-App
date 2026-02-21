const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dealership.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_reps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      vehicle_interest TEXT,
      vehicle_type TEXT,
      budget INTEGER,
      source TEXT DEFAULT 'walk-in',
      status TEXT DEFAULT 'new',
      notes TEXT,
      sales_rep_id INTEGER NOT NULL,
      priority_score INTEGER DEFAULT 0,
      next_followup_date TEXT,
      last_contacted_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id)
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      sales_rep_id INTEGER NOT NULL,
      scheduled_date TEXT NOT NULL,
      type TEXT DEFAULT 'call',
      notes TEXT,
      completed INTEGER DEFAULT 0,
      completed_at TEXT,
      outcome TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      sales_rep_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id)
    );
  `);

  console.log('Database initialized successfully');
}

// Priority scoring: higher score = needs attention sooner
function calculatePriorityScore(lead) {
  let score = 0;
  const now = new Date();

  // Status weights
  const statusWeights = {
    new: 70,
    contacted: 50,
    interested: 80,
    quoted: 90,
    negotiating: 95,
    won: 0,
    lost: 0,
  };
  score += statusWeights[lead.status] || 0;

  // Days since last contact penalty (the longer it's been, the higher urgency)
  if (lead.last_contacted_date) {
    const daysSince = Math.floor(
      (now - new Date(lead.last_contacted_date)) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 1) score += 5;
    else if (daysSince <= 3) score += 20;
    else if (daysSince <= 7) score += 40;
    else if (daysSince <= 14) score += 60;
    else score += 80;
  } else {
    // Never been contacted - high urgency for new leads
    score += 50;
  }

  // Overdue follow-up bonus
  if (lead.next_followup_date) {
    const followupDate = new Date(lead.next_followup_date);
    if (followupDate < now) {
      const daysOverdue = Math.floor((now - followupDate) / (1000 * 60 * 60 * 24));
      score += Math.min(daysOverdue * 10, 50);
    }
  }

  // Budget bonus (higher budget = higher priority)
  if (lead.budget) {
    if (lead.budget >= 20000) score += 15;
    else if (lead.budget >= 10000) score += 10;
    else if (lead.budget >= 5000) score += 5;
  }

  return Math.min(score, 200); // Cap at 200
}

function updateLeadPriorityScore(leadId) {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(leadId);
  if (!lead) return;

  const score = calculatePriorityScore(lead);
  db.prepare("UPDATE leads SET priority_score = ?, updated_at = datetime('now') WHERE id = ?")
    .run(score, leadId);

  return score;
}

module.exports = { db, initializeDatabase, calculatePriorityScore, updateLeadPriorityScore };
