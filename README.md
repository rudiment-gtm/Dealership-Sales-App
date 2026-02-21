# ⚡ PowerTrack — Powersport Dealership Follow-Up CRM

A focused, fast CRM designed to help powersport dealership sales reps know **exactly who to call, when, and why** — so no hot lead goes cold.

---

## Features

- **Smart Priority Queue** — Leads automatically scored 0–200 based on status, days since last contact, and follow-up overdue status
- **Daily Follow-Up Dashboard** — See overdue, due-today, and upcoming follow-ups at a glance
- **Lead Management** — Track motorcycles, ATVs, UTVs, watercraft, snowmobiles, and more
- **One-Click Follow-Up Completion** — Mark done, log outcome, and schedule the next follow-up in one step
- **Activity Timeline** — Full history of calls, emails, texts, visits, and notes per lead
- **Multi-Rep Support** — Switch between sales reps; manager can view all leads
- **Lead Sources** — Walk-in, phone, website, referral, social media, event

## Priority Score Logic

| Factor | Score |
|--------|-------|
| Status: Negotiating | +95 |
| Status: Quoted | +90 |
| Status: Interested | +80 |
| Status: New | +70 |
| Last contacted 8–14 days ago | +60 |
| Last contacted 4–7 days ago | +40 |
| Follow-up overdue | +10/day (max 50) |
| Budget ≥ $20k | +15 |

**Critical (150+)** = call immediately · **High (100–149)** = call today · **Medium (60–99)** = this week · **Low (<60)** = monitor

---

## Getting Started

### Prerequisites
- Node.js 18+

### Install & Run

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Seed demo data (optional but recommended)
cd backend && node seed.js

# Start backend (port 3001)
cd backend && npm start

# Start frontend (port 3000) — in a new terminal
cd frontend && npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
├── backend/
│   ├── server.js          # Express app entry point
│   ├── database.js        # SQLite setup + priority scoring
│   ├── seed.js            # Demo data seeder
│   └── routes/
│       ├── leads.js
│       ├── followups.js
│       ├── activities.js
│       └── reps.js
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js             # API client
        ├── context/
        │   └── AppContext.jsx # Current rep state
        ├── components/
        │   ├── Layout.jsx
        │   ├── PriorityBadge.jsx
        │   └── StatusBadge.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── FollowUpQueue.jsx
            ├── LeadList.jsx
            ├── LeadDetail.jsx
            └── Settings.jsx
```

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3
- **Frontend**: React 18, React Router v6, date-fns
- **Database**: SQLite (file: `backend/dealership.db`)
