import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { formatDistanceToNow, format, isPast, isToday, isTomorrow } from 'date-fns';

const TYPE_ICONS = { call: '📞', email: '✉️', text: '💬', visit: '🏍️' };

export default function FollowUpQueue() {
  const { currentRep } = useApp();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [filter, setFilter] = useState('due'); // due | upcoming | all

  const load = useCallback(async () => {
    if (!currentRep) return;
    setLoading(true);
    try {
      let data;
      if (filter === 'due') {
        data = await api.getTodayFollowups({ rep_id: currentRep.id });
      } else if (filter === 'upcoming') {
        data = await api.getUpcomingFollowups({ rep_id: currentRep.id });
      } else {
        data = await api.getFollowups({ rep_id: currentRep.id, completed: false });
      }
      setFollowups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentRep, filter]);

  useEffect(() => { load(); }, [load]);

  const overdue = followups.filter(f => isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date)));
  const todayItems = followups.filter(f => isToday(new Date(f.scheduled_date)));
  const rest = followups.filter(f => !isPast(new Date(f.scheduled_date)) && !isToday(new Date(f.scheduled_date)));

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            📋 Follow-Up Queue
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            {currentRep?.name} — {followups.length} follow-up{followups.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 4, background: '#e2e8f0', borderRadius: 8,
        padding: 4, marginBottom: 24, width: 'fit-content',
      }}>
        {[
          { key: 'due', label: '⚡ Due Now' },
          { key: 'upcoming', label: '📅 Upcoming (7d)' },
          { key: 'all', label: '📋 All Pending' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: 13,
            fontWeight: filter === key ? 600 : 400,
            background: filter === key ? '#fff' : 'transparent',
            color: filter === key ? '#0f172a' : '#64748b',
            boxShadow: filter === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#64748b', padding: 20 }}>Loading...</div>
      ) : followups.length === 0 ? (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 12, padding: 40, textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#166534' }}>
            {filter === 'due' ? 'No overdue or due-today follow-ups!' : 'Nothing here!'}
          </div>
          <div style={{ fontSize: 13, color: '#4ade80', marginTop: 4 }}>
            {filter === 'due' ? 'Great work staying on top of your leads.' : 'All clear for this view.'}
          </div>
        </div>
      ) : (
        <div>
          {overdue.length > 0 && (
            <Section title={`⚠️ Overdue (${overdue.length})`} color="#dc2626" bg="#fef2f2">
              {overdue.map(f => (
                <FollowUpRow key={f.id} followup={f} onComplete={() => setCompleting(f)} />
              ))}
            </Section>
          )}

          {todayItems.length > 0 && (
            <Section title={`📅 Due Today (${todayItems.length})`} color="#2563eb" bg="#eff6ff">
              {todayItems.map(f => (
                <FollowUpRow key={f.id} followup={f} onComplete={() => setCompleting(f)} />
              ))}
            </Section>
          )}

          {rest.length > 0 && (
            <Section title={`🗓️ Upcoming (${rest.length})`} color="#64748b" bg="#f8fafc">
              {rest.map(f => (
                <FollowUpRow key={f.id} followup={f} onComplete={() => setCompleting(f)} />
              ))}
            </Section>
          )}
        </div>
      )}

      {completing && (
        <CompleteModal
          followup={completing}
          repId={currentRep?.id}
          onClose={() => setCompleting(null)}
          onDone={() => { setCompleting(null); load(); }}
        />
      )}
    </div>
  );
}

function Section({ title, children, color, bg }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '8px 14px', background: bg, borderRadius: 8,
        borderLeft: `4px solid ${color}`,
      }}>
        <span style={{ fontWeight: 700, fontSize: 14, color }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function FollowUpRow({ followup, onComplete }) {
  const scheduled = new Date(followup.scheduled_date);
  const overdue = isPast(scheduled) && !isToday(scheduled);
  const todayFlag = isToday(scheduled);
  const tomorrowFlag = isTomorrow(scheduled);

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '14px 16px',
      border: `1px solid ${overdue ? '#fecaca' : '#e2e8f0'}`,
      boxShadow: 'var(--shadow)',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      {/* Type icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: overdue ? '#fee2e2' : '#eff6ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {TYPE_ICONS[followup.type] || '📋'}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <Link to={`/leads/${followup.lead_id}`} style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>
              {followup.first_name} {followup.last_name}
            </Link>
            {followup.phone && (
              <a href={`tel:${followup.phone}`} style={{ fontSize: 12, color: '#2563eb', marginLeft: 10 }}>
                {followup.phone}
              </a>
            )}
          </div>
          <div style={{ fontSize: 12, color: overdue ? '#dc2626' : '#64748b', fontWeight: overdue ? 600 : 400, flexShrink: 0 }}>
            {overdue
              ? `🔴 ${formatDistanceToNow(scheduled, { addSuffix: true })}`
              : todayFlag ? '🟢 Today'
              : tomorrowFlag ? '🟡 Tomorrow'
              : format(scheduled, 'EEE, MMM d')}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {followup.vehicle_interest || followup.vehicle_type || 'Powersport vehicle'} — {followup.type?.toUpperCase()}
        </div>

        {followup.notes && (
          <div style={{
            fontSize: 12, color: '#475569', marginTop: 6,
            padding: '5px 10px', background: '#f8fafc', borderRadius: 6,
          }}>
            📝 {followup.notes}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={followup.lead_status} />
          <PriorityBadge score={followup.priority_score} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <Link to={`/leads/${followup.lead_id}`} style={{
          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
          background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
        }}>View</Link>
        <button onClick={onComplete} style={{
          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer',
        }}>✓ Done</button>
      </div>
    </div>
  );
}

function CompleteModal({ followup, repId, onClose, onDone }) {
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextDate, setNextDate] = useState('');
  const [nextType, setNextType] = useState('call');
  const [saving, setSaving] = useState(false);

  // Default next date to 3 days from now
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setNextDate(d.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.completeFollowup(followup.id, {
        outcome,
        notes,
        next_followup_date: scheduleNext ? nextDate : null,
        next_followup_type: scheduleNext ? nextType : null,
      });
      onDone();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 480,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>
          ✓ Complete Follow-Up
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b' }}>
          {followup.first_name} {followup.last_name} — {followup.type?.toUpperCase()}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Outcome</label>
          <select value={outcome} onChange={e => setOutcome(e.target.value)} style={inputStyle}>
            <option value="">-- Select outcome --</option>
            <option>Left voicemail</option>
            <option>Spoke with customer</option>
            <option>Customer will come in</option>
            <option>Not interested</option>
            <option>Ready to buy</option>
            <option>Needs more time</option>
            <option>No answer</option>
          </select>

          <label style={labelStyle}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="What happened? Anything to remember..."
            style={{ ...inputStyle, resize: 'vertical' }}
          />

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px',
            padding: '12px 14px', background: '#f8fafc', borderRadius: 8,
          }}>
            <input
              type="checkbox"
              id="schedNext"
              checked={scheduleNext}
              onChange={e => setScheduleNext(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="schedNext" style={{ fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>
              Schedule next follow-up
            </label>
          </div>

          {scheduleNext && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={nextDate}
                  onChange={e => setNextDate(e.target.value)}
                  required={scheduleNext}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={nextType} onChange={e => setNextType(e.target.value)} style={inputStyle}>
                  <option value="call">📞 Call</option>
                  <option value="email">✉️ Email</option>
                  <option value="text">💬 Text</option>
                  <option value="visit">🏍️ Visit</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#475569', fontSize: 14, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 8, border: 'none',
              background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{saving ? 'Saving...' : '✓ Mark Complete'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
};

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, color: '#0f172a',
  background: '#fff', outline: 'none', marginBottom: 12,
  boxSizing: 'border-box',
};
