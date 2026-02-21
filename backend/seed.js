/**
 * Seed script - populate the database with sample data for demo purposes
 * Run with: node seed.js
 */
const { db, initializeDatabase, updateLeadPriorityScore } = require('./database');

initializeDatabase();

// Clear existing data
db.exec(`
  DELETE FROM activities;
  DELETE FROM followups;
  DELETE FROM leads;
  DELETE FROM sales_reps;
`);

// Seed sales reps
const reps = [
  { name: 'Jake Morrison', email: 'jake@dealership.com' },
  { name: 'Maria Santos', email: 'maria@dealership.com' },
  { name: 'Tyler Brooks', email: 'tyler@dealership.com' },
];

const repIds = reps.map(r => {
  const res = db.prepare('INSERT INTO sales_reps (name, email) VALUES (?, ?)').run(r.name, r.email);
  return res.lastInsertRowid;
});

const today = new Date();
const daysAgo = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};
const daysFromNow = (n) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

// Seed leads
const leads = [
  {
    first_name: 'Chris', last_name: 'Hartley',
    email: 'chartley@email.com', phone: '555-201-3344',
    vehicle_interest: '2024 Kawasaki Ninja 650', vehicle_type: 'motorcycle',
    budget: 8500, source: 'walk-in', status: 'quoted',
    notes: 'Very interested. Wants in blue. Financing pre-approved.',
    sales_rep_id: repIds[0],
    last_contacted_date: daysAgo(4),
    next_followup_date: daysAgo(1),
  },
  {
    first_name: 'Amanda', last_name: 'Torres',
    email: 'atorres@email.com', phone: '555-837-2291',
    vehicle_interest: '2024 Can-Am Spyder F3', vehicle_type: 'three-wheeler',
    budget: 22000, source: 'website', status: 'interested',
    notes: 'Looking for a comfortable long-distance ride. Compared ours with Honda.',
    sales_rep_id: repIds[0],
    last_contacted_date: daysAgo(2),
    next_followup_date: daysFromNow(1),
  },
  {
    first_name: 'Derek', last_name: 'Nunez',
    email: 'dnunez@email.com', phone: '555-494-6610',
    vehicle_interest: '2024 Polaris Sportsman 570', vehicle_type: 'atv',
    budget: 12000, source: 'referral', status: 'negotiating',
    notes: 'Farm use. Wants tow package. Close to deal - needs $500 off.',
    sales_rep_id: repIds[1],
    last_contacted_date: daysAgo(1),
    next_followup_date: daysFromNow(0),
  },
  {
    first_name: 'Kelsey', last_name: 'Ingram',
    email: 'kingram@email.com', phone: '555-772-0043',
    vehicle_interest: '2024 Sea-Doo Spark', vehicle_type: 'watercraft',
    budget: 7000, source: 'phone', status: 'new',
    notes: 'Called asking about summer inventory. Has a boat trailer already.',
    sales_rep_id: repIds[1],
    last_contacted_date: null,
    next_followup_date: daysAgo(2),
  },
  {
    first_name: 'Marcus', last_name: 'Webb',
    email: 'mwebb@email.com', phone: '555-310-8821',
    vehicle_interest: '2024 Honda Pioneer 1000', vehicle_type: 'utv',
    budget: 18500, source: 'walk-in', status: 'contacted',
    notes: 'Deer hunting / trail riding. Wants side-by-side for whole family.',
    sales_rep_id: repIds[2],
    last_contacted_date: daysAgo(8),
    next_followup_date: daysAgo(3),
  },
  {
    first_name: 'Brianna', last_name: 'Cole',
    email: 'bcole@email.com', phone: '555-654-9901',
    vehicle_interest: '2024 Yamaha YZ450F', vehicle_type: 'dirt-bike',
    budget: 11000, source: 'social media', status: 'interested',
    notes: 'Racing enthusiast. Wants to trade in current 2021 YZ250.',
    sales_rep_id: repIds[0],
    last_contacted_date: daysAgo(5),
    next_followup_date: daysFromNow(2),
  },
  {
    first_name: 'Tom', last_name: 'Gallagher',
    email: 'tgallagher@email.com', phone: '555-902-1188',
    vehicle_interest: '2024 Harley-Davidson Street Glide', vehicle_type: 'motorcycle',
    budget: 32000, source: 'walk-in', status: 'new',
    notes: 'First time HD buyer. Wants financing options. Came in weekend.',
    sales_rep_id: repIds[2],
    last_contacted_date: null,
    next_followup_date: daysAgo(0),
  },
  {
    first_name: 'Samantha', last_name: 'Hicks',
    email: 'shicks@email.com', phone: '555-223-4400',
    vehicle_interest: '2024 Arctic Cat ZR 6000', vehicle_type: 'snowmobile',
    budget: 15000, source: 'referral', status: 'quoted',
    notes: 'Buying for husband as birthday gift. Has until end of month.',
    sales_rep_id: repIds[1],
    last_contacted_date: daysAgo(3),
    next_followup_date: daysFromNow(1),
  },
];

const leadIds = leads.map(l => {
  const res = db.prepare(`
    INSERT INTO leads (
      first_name, last_name, email, phone,
      vehicle_interest, vehicle_type, budget,
      source, status, notes, sales_rep_id,
      last_contacted_date, next_followup_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    l.first_name, l.last_name, l.email, l.phone,
    l.vehicle_interest, l.vehicle_type, l.budget,
    l.source, l.status, l.notes, l.sales_rep_id,
    l.last_contacted_date, l.next_followup_date
  );
  return res.lastInsertRowid;
});

// Seed follow-ups
const followups = [
  { lead_id: leadIds[0], sales_rep_id: repIds[0], scheduled_date: daysAgo(1), type: 'call', notes: 'Check if ready to sign', completed: 0 },
  { lead_id: leadIds[1], sales_rep_id: repIds[0], scheduled_date: daysFromNow(1), type: 'email', notes: 'Send comparison sheet vs Honda', completed: 0 },
  { lead_id: leadIds[2], sales_rep_id: repIds[1], scheduled_date: daysFromNow(0), type: 'call', notes: 'Final price discussion', completed: 0 },
  { lead_id: leadIds[3], sales_rep_id: repIds[1], scheduled_date: daysAgo(2), type: 'call', notes: 'Initial follow-up', completed: 0 },
  { lead_id: leadIds[4], sales_rep_id: repIds[2], scheduled_date: daysAgo(3), type: 'text', notes: 'Check interest level', completed: 0 },
  { lead_id: leadIds[5], sales_rep_id: repIds[0], scheduled_date: daysFromNow(2), type: 'call', notes: 'Trade-in appraisal ready', completed: 0 },
  { lead_id: leadIds[6], sales_rep_id: repIds[2], scheduled_date: daysFromNow(0), type: 'call', notes: 'Welcome follow-up, send financing options', completed: 0 },
  { lead_id: leadIds[7], sales_rep_id: repIds[1], scheduled_date: daysFromNow(1), type: 'call', notes: 'Confirm quote details', completed: 0 },
];

followups.forEach(f => {
  db.prepare(`
    INSERT INTO followups (lead_id, sales_rep_id, scheduled_date, type, notes, completed)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(f.lead_id, f.sales_rep_id, f.scheduled_date, f.type, f.notes, f.completed);
});

// Seed some past activities
const activities = [
  { lead_id: leadIds[0], sales_rep_id: repIds[0], type: 'visit', notes: 'Customer test rode Ninja 650. Very excited.' },
  { lead_id: leadIds[0], sales_rep_id: repIds[0], type: 'call', notes: 'Discussed financing options. Will call back.' },
  { lead_id: leadIds[2], sales_rep_id: repIds[1], type: 'visit', notes: 'Brought wife in to look. Both loved the Sportsman 570.' },
  { lead_id: leadIds[4], sales_rep_id: repIds[2], type: 'call', notes: 'Left voicemail. Will try again.' },
  { lead_id: leadIds[7], sales_rep_id: repIds[1], type: 'email', notes: 'Sent full quote with accessories.' },
];

activities.forEach(a => {
  db.prepare(`
    INSERT INTO activities (lead_id, sales_rep_id, type, notes)
    VALUES (?, ?, ?, ?)
  `).run(a.lead_id, a.sales_rep_id, a.type, a.notes);
});

// Calculate priority scores for all leads
leadIds.forEach(id => updateLeadPriorityScore(id));

console.log(`✅ Seeded ${reps.length} reps, ${leads.length} leads, ${followups.length} follow-ups, ${activities.length} activities`);
