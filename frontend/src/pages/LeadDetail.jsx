import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge, { STATUS_CONFIG } from '../components/StatusBadge';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';

const TYPE_ICONS = { call: '📞', email: '✉️', text: '💬', visit: '🏍️', note: '📝', status_change: '🔄' };

const VEHICLE_TYPES = ['motorcycle', 'dirt-bike', 'atv', 'utv', 'watercraft', 'snowmobile', 'three-wheeler'];

export default function LeadDetail() {
  const { id } = useParams();
  const { currentRep } = useApp();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getLead(id);
      setLead(data);
      setEditForm({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email || '',
        phone: data.phone || '',
        vehicle_interest: data.vehicle_interest || '',
        vehicle_type: data.vehicle_type || '',
        budget: data.budget || '',
        source: data.source || 'walk-in',
        status: data.status,
        notes: data.notes || '',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateLead(id, {
        ...editForm,
        budget: editForm.budget ? parseInt(editForm.budget) : null,
        sales_rep_id: currentRep?.id,
      });
      setEditing(false);
      load();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete lead for ${lead.first_name} ${lead.last_name}? This cannot be undone.`)) return;
    await api.deleteLead(id);
    navigate('/leads');
  };

  const handleCompleteFollowup = async (followupId) => {
    await api.completeFollowup(followupId, { outcome: 'Completed' });
    load();
  };

  const handleDeleteFollowup = async (followupId) => {
    await api.deleteFollowup(followupId);
    load();
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b' }}>Loading...</div>;
  if (!lead) return <div style={{ padding: 40, color: '#dc2626' }}>Lead not found.</div>;

  const pendingFollowups = lead.followups?.filter(f => !f.completed) || [];
  const completedFollowups = lead.followups?.filter(f => f.completed) || [];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Back */}
      <Link to="/leads" style={{ fontSize: 13, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
        ← Back to Leads
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {lead.first_name} {lead.last_name}
            </h1>
            <StatusBadge status={lead.status} />
            <PriorityBadge score={lead.priority_score} />
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Rep: {lead.rep_name} · Added {format(new Date(lead.created_at), 'MMM d, yyyy')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(!editing)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
            background: editing ? '#fef3c7' : '#fff', color: '#475569', fontSize: 13, cursor: 'pointer',
          }}>{editing ? 'Cancel Edit' : '✏️ Edit'}</button>
          <button onClick={handleDelete} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #fecaca',
            background: '#fff', color: '#dc2626', fontSize: 13, cursor: 'pointer',
          }}>Delete</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* Left column */}
        <div>
          {/* Info card */}
          {editing ? (
            <EditForm
              form={editForm}
              setForm={setEditForm}
              onSubmit={handleSaveEdit}
              onCancel={() => setEditing(false)}
              saving={saving}
            />
          ) : (
            <InfoCard lead={lead} />
          )}

          {/* Activity Log */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Activity Log</h2>
              <button onClick={() => setShowActivityForm(!showActivityForm)} style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#475569', fontSize: 12, cursor: 'pointer',
              }}>+ Log Activity</button>
            </div>

            {showActivityForm && (
              <LogActivityForm
                leadId={id}
                repId={currentRep?.id}
                onDone={() => { setShowActivityForm(false); load(); }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(lead.activities || []).length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8', padding: '12px 0' }}>No activities logged yet.</div>
              ) : (lead.activities || []).map(a => (
                <div key={a.id} style={{
                  display: 'flex', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>
                    {TYPE_ICONS[a.type] || '📋'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>
                      {a.type?.charAt(0).toUpperCase() + a.type?.slice(1)}
                      <span style={{ fontWeight: 400, color: '#64748b', fontSize: 12 }}> · {a.rep_name}</span>
                    </div>
                    {a.notes && <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{a.notes}</div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Follow-ups */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Follow-Ups</h2>
            <button onClick={() => setShowFollowupForm(!showFollowupForm)} style={{
              padding: '5px 12px', borderRadius: 6, border: 'none',
              background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>+ Schedule</button>
          </div>

          {showFollowupForm && (
            <AddFollowupForm
              leadId={id}
              repId={currentRep?.id}
              onDone={() => { setShowFollowupForm(false); load(); }}
            />
          )}

          {/* Quick status change */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Update Status
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={async () => {
                  await api.updateLead(id, { status: key, sales_rep_id: currentRep?.id });
                  load();
                }} style={{
                  padding: '4px 10px', borderRadius: 20, border: `1px solid ${lead.status === key ? cfg.color : '#e2e8f0'}`,
                  background: lead.status === key ? cfg.bg : '#fff',
                  color: lead.status === key ? cfg.color : '#64748b',
                  fontSize: 11, fontWeight: lead.status === key ? 700 : 500, cursor: 'pointer',
                }}>{cfg.label}</button>
              ))}
            </div>
          </div>

          {/* Pending follow-ups */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending ({pendingFollowups.length})
            </div>
            {pendingFollowups.length === 0 ? (
              <div style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>No pending follow-ups</div>
            ) : pendingFollowups.map(f => (
              <FollowupItem
                key={f.id}
                followup={f}
                onComplete={() => handleCompleteFollowup(f.id)}
                onDelete={() => handleDeleteFollowup(f.id)}
              />
            ))}
          </div>

          {/* Completed follow-ups */}
          {completedFollowups.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completed ({completedFollowups.length})
              </div>
              {completedFollowups.map(f => (
                <FollowupItem key={f.id} followup={f} done />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ lead }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
        {[
          { label: 'Phone', value: lead.phone ? <a href={`tel:${lead.phone}`} style={{ color: '#2563eb' }}>{lead.phone}</a> : '—' },
          { label: 'Email', value: lead.email ? <a href={`mailto:${lead.email}`} style={{ color: '#2563eb' }}>{lead.email}</a> : '—' },
          { label: 'Vehicle Interest', value: lead.vehicle_interest || '—' },
          { label: 'Vehicle Type', value: lead.vehicle_type ? lead.vehicle_type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—' },
          { label: 'Budget', value: lead.budget ? `$${lead.budget.toLocaleString()}` : '—' },
          { label: 'Lead Source', value: lead.source ? lead.source.replace(/\b\w/g, c => c.toUpperCase()) : '—' },
          { label: 'Last Contacted', value: lead.last_contacted_date ? formatDistanceToNow(new Date(lead.last_contacted_date), { addSuffix: true }) : <span style={{ color: '#dc2626' }}>Never</span> },
          { label: 'Next Follow-Up', value: lead.next_followup_date ? format(new Date(lead.next_followup_date), 'MMM d, yyyy') : 'None scheduled' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontSize: 14, color: '#1e293b' }}>{value}</div>
          </div>
        ))}
      </div>

      {lead.notes && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Notes
          </div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{lead.notes}</div>
        </div>
      )}
    </div>
  );
}

function EditForm({ form, setForm, onSubmit, onCancel, saving }) {
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={onSubmit} style={{ background: '#fff', borderRadius: 12, border: '1px solid #f59e0b', padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        ✏️ Editing Lead
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="First Name" value={form.first_name} onChange={set('first_name')} required />
        <Field label="Last Name" value={form.last_name} onChange={set('last_name')} required />
        <Field label="Phone" value={form.phone} onChange={set('phone')} type="tel" />
        <Field label="Email" value={form.email} onChange={set('email')} type="email" />
        <div>
          <label style={labelStyle}>Vehicle Type</label>
          <select value={form.vehicle_type} onChange={set('vehicle_type')} style={inputStyle}>
            <option value="">None</option>
            {VEHICLE_TYPES.map(v => (
              <option key={v} value={v}>{v.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <Field label="Budget ($)" value={form.budget} onChange={set('budget')} type="number" />
      </div>
      <Field label="Vehicle Interest" value={form.vehicle_interest} onChange={set('vehicle_interest')} placeholder="2024 Kawasaki Ninja 650" />
      <div>
        <label style={labelStyle}>Notes</label>
        <textarea value={form.notes} onChange={set('notes')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{
          flex: 1, padding: '8px', borderRadius: 7, border: '1px solid #e2e8f0',
          background: '#f8fafc', color: '#475569', fontSize: 13, cursor: 'pointer',
        }}>Cancel</button>
        <button type="submit" disabled={saving} style={{
          flex: 2, padding: '8px', borderRadius: 7, border: 'none',
          background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </form>
  );
}

function FollowupItem({ followup, onComplete, onDelete, done }) {
  const scheduled = new Date(followup.scheduled_date);
  const overdue = !done && isPast(scheduled) && !isToday(scheduled);
  const TYPE_ICONS = { call: '📞', email: '✉️', text: '💬', visit: '🏍️' };

  return (
    <div style={{
      background: done ? '#f8fafc' : '#fff', borderRadius: 8, padding: '10px 14px',
      border: `1px solid ${overdue ? '#fecaca' : '#e2e8f0'}`,
      marginBottom: 8, opacity: done ? 0.75 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: done ? '#64748b' : '#0f172a' }}>
            {TYPE_ICONS[followup.type] || '📋'} {followup.type?.toUpperCase()}
            {done && <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a' }}>✓ Done</span>}
          </div>
          <div style={{ fontSize: 12, color: overdue ? '#dc2626' : '#64748b', marginTop: 2 }}>
            {done
              ? `Completed ${followup.completed_at ? formatDistanceToNow(new Date(followup.completed_at), { addSuffix: true }) : ''}`
              : overdue
                ? `⚠️ Was due ${format(scheduled, 'MMM d')}`
                : isToday(scheduled) ? 'Due today' : format(scheduled, 'MMM d, yyyy')}
          </div>
          {followup.notes && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{followup.notes}</div>}
          {followup.outcome && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Outcome: {followup.outcome}</div>}
        </div>
        {!done && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={onComplete} style={{
              padding: '3px 8px', borderRadius: 5, border: 'none',
              background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>✓</button>
            <button onClick={onDelete} style={{
              padding: '3px 8px', borderRadius: 5, border: '1px solid #fecaca',
              background: '#fff', color: '#dc2626', fontSize: 11, cursor: 'pointer',
            }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddFollowupForm({ leadId, repId, onDone }) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [form, setForm] = useState({
    scheduled_date: tomorrow.toISOString().split('T')[0],
    type: 'call',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createFollowup({ ...form, lead_id: parseInt(leadId), sales_rep_id: parseInt(repId) });
      onDone();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px', marginBottom: 16,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" value={form.scheduled_date} onChange={set('scheduled_date')} required style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={form.type} onChange={set('type')} style={inputStyle}>
            <option value="call">📞 Call</option>
            <option value="email">✉️ Email</option>
            <option value="text">💬 Text</option>
            <option value="visit">🏍️ Visit</option>
          </select>
        </div>
      </div>
      <label style={labelStyle}>Notes</label>
      <input type="text" value={form.notes} onChange={set('notes')} placeholder="Optional note..." style={{ ...inputStyle, marginBottom: 10 }} />
      <button type="submit" disabled={saving} style={{
        width: '100%', padding: '8px', borderRadius: 7, border: 'none',
        background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>{saving ? 'Scheduling...' : 'Schedule Follow-Up'}</button>
    </form>
  );
}

function LogActivityForm({ leadId, repId, onDone }) {
  const [form, setForm] = useState({ type: 'call', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.logActivity({ ...form, lead_id: parseInt(leadId), sales_rep_id: parseInt(repId) });
      onDone();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px', marginBottom: 12,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label style={labelStyle}>Type *</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
            <option value="call">📞 Call</option>
            <option value="email">✉️ Email</option>
            <option value="text">💬 Text</option>
            <option value="visit">🏍️ Visit</option>
            <option value="note">📝 Note</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What happened?" style={inputStyle} />
        </div>
      </div>
      <button type="submit" disabled={saving} style={{
        width: '100%', padding: '8px', borderRadius: 7, border: 'none',
        background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
      }}>{saving ? 'Logging...' : 'Log Activity'}</button>
    </form>
  );
}

const VEHICLE_TYPES = ['motorcycle', 'dirt-bike', 'atv', 'utv', 'watercraft', 'snowmobile', 'three-wheeler'];

function Field({ label, required, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input style={inputStyle} required={required} {...props} />
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em',
};

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 7,
  border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a',
  background: '#fff', outline: 'none', marginBottom: 2, boxSizing: 'border-box',
};
