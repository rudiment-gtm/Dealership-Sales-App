import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';

function StatCard({ label, value, sub, color = '#2563eb', icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'flex-start', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: color + '18', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentRep } = useApp();
  const [stats, setStats] = useState(null);
  const [todayQueue, setTodayQueue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [hotLeads, setHotLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentRep) return;

    const load = async () => {
      setLoading(true);
      try {
        const [statsData, todayData, upcomingData, leadsData] = await Promise.all([
          api.getRepStats(currentRep.id),
          api.getTodayFollowups({ rep_id: currentRep.id }),
          api.getUpcomingFollowups({ rep_id: currentRep.id }),
          api.getLeads({ rep_id: currentRep.id, sort: 'priority_score', order: 'DESC' }),
        ]);
        setStats(statsData);
        setTodayQueue(todayData);
        setUpcoming(upcomingData);
        setHotLeads(leadsData.filter(l => !['won','lost'].includes(l.status)).slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentRep]);

  if (!currentRep) return <div style={{ padding: 40, color: '#64748b' }}>Select a sales rep to continue.</div>;
  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading dashboard...</div>;

  const overdue = todayQueue.filter(f => isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date)));
  const dueToday = todayQueue.filter(f => isToday(new Date(f.scheduled_date)));
  const allDue = [...overdue, ...dueToday];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>
          Good {getGreeting()}, {currentRep.name.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your sales pipeline
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard icon="👥" label="Active Leads" value={stats?.activeLeads || 0} color="#2563eb" />
        <StatCard icon="📋" label="Due Today" value={dueToday.length}
          sub={overdue.length > 0 ? `+${overdue.length} overdue` : 'All caught up!'}
          color={overdue.length > 0 ? '#dc2626' : '#16a34a'} />
        <StatCard icon="⚠️" label="Overdue Follow-Ups" value={stats?.overdueFollowups || 0}
          sub={stats?.overdueFollowups > 0 ? 'Needs attention' : 'None overdue'}
          color={stats?.overdueFollowups > 0 ? '#ea580c' : '#16a34a'} />
        <StatCard icon="🏆" label="Deals Won (Month)" value={stats?.wonThisMonth || 0}
          color="#16a34a" sub="This calendar month" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        {/* Left: Due Today + Overdue */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              {allDue.length > 0 ? `⚡ Action Required (${allDue.length})` : '✅ All Caught Up'}
            </h2>
            <Link to="/queue" style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>
              View full queue →
            </Link>
          </div>

          {allDue.length === 0 ? (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 12, padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 600, color: '#166534' }}>No overdue follow-ups!</div>
              <div style={{ fontSize: 13, color: '#4ade80', marginTop: 4 }}>
                You're all caught up. Check upcoming follow-ups below.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allDue.map(f => (
                <FollowUpCard key={f.id} followup={f} />
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>
                📅 Upcoming (Next 7 Days)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(f => (
                  <FollowUpCard key={f.id} followup={f} isUpcoming />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Hot Leads */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>🔥 Top Priority Leads</h2>
            <Link to="/leads" style={{ fontSize: 13, color: '#2563eb', fontWeight: 500 }}>All leads →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hotLeads.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: 13, padding: 16 }}>No active leads</div>
            ) : hotLeads.map(lead => (
              <Link key={lead.id} to={`/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff', borderRadius: 10, padding: '12px 16px',
                  border: '1px solid var(--border)', boxShadow: 'var(--shadow)',
                  transition: 'box-shadow 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                      {lead.first_name} {lead.last_name}
                    </div>
                    <PriorityBadge score={lead.priority_score} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    {lead.vehicle_interest || 'No vehicle specified'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <StatusBadge status={lead.status} />
                    {lead.last_contacted_date && (
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        Last contact: {formatDistanceToNow(new Date(lead.last_contacted_date), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {lead.overdue_followups > 0 && (
                    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>
                      ⚠️ {lead.overdue_followups} overdue follow-up{lead.overdue_followups > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FollowUpCard({ followup, isUpcoming }) {
  const scheduled = new Date(followup.scheduled_date);
  const overdue = !isUpcoming && isPast(scheduled) && !isToday(scheduled);

  const typeIcons = { call: '📞', email: '✉️', text: '💬', visit: '🏍️' };

  return (
    <Link to={`/leads/${followup.lead_id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: '12px 16px',
        border: `1px solid ${overdue ? '#fecaca' : 'var(--border)'}`,
        boxShadow: 'var(--shadow)',
        borderLeft: `4px solid ${overdue ? '#dc2626' : isUpcoming ? '#2563eb' : '#16a34a'}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
              {followup.first_name} {followup.last_name}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              {followup.vehicle_interest || followup.vehicle_type || 'Powersport vehicle'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: overdue ? '#dc2626' : isUpcoming ? '#2563eb' : '#0f172a',
            }}>
              {typeIcons[followup.type] || '📋'} {followup.type?.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: overdue ? '#dc2626' : '#64748b', marginTop: 2 }}>
              {overdue
                ? `Overdue: ${formatDistanceToNow(scheduled, { addSuffix: true })}`
                : isToday(scheduled)
                  ? 'Today'
                  : format(scheduled, 'EEE, MMM d')}
            </div>
          </div>
        </div>
        {followup.notes && (
          <div style={{
            fontSize: 12, color: '#475569', marginTop: 8,
            padding: '6px 10px', background: '#f8fafc', borderRadius: 6,
          }}>
            {followup.notes}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <StatusBadge status={followup.lead_status} />
          <PriorityBadge score={followup.priority_score} />
        </div>
      </div>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
