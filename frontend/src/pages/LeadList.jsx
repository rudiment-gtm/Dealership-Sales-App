import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { formatDistanceToNow, format } from 'date-fns';

const VEHICLE_TYPES = ['', 'motorcycle', 'dirt-bike', 'atv', 'utv', 'watercraft', 'snowmobile', 'three-wheeler'];

export default function LeadList() {
  const { currentRep } = useApp();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [sortBy, setSortBy] = useState('priority_score');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewAll, setViewAll] = useState(false);

  const load = useCallback(async () => {
    if (!currentRep) return;
    setLoading(true);
    try {
      const params = { sort: sortBy, order: 'DESC' };
      if (!viewAll) params.rep_id = currentRep.id;
      if (statusFilter) params.status = statusFilter;
      const data = await api.getLeads(params);
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentRep, sortBy, statusFilter, viewAll]);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const nameMatch = `${l.first_name} ${l.last_name}`.toLowerCase().includes(q);
    const vehicleMatch = (l.vehicle_interest || '').toLowerCase().includes(q);
    const phoneMatch = (l.phone || '').includes(q);
    const typeMatch = !vehicleFilter || l.vehicle_type === vehicleFilter;
    return (nameMatch || vehicleMatch || phoneMatch) && typeMatch;
  });

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>👥 Leads</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''} {viewAll ? '(all reps)' : `(${currentRep?.name})`}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search name, vehicle, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 13, width: 240, outline: 'none',
          }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="interested">Interested</option>
          <option value="quoted">Quoted</option>
          <option value="negotiating">Negotiating</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)} style={selectStyle}>
          <option value="">All Vehicles</option>
          {VEHICLE_TYPES.filter(v => v).map(v => (
            <option key={v} value={v}>{v.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
          <option value="priority_score">Sort: Priority</option>
          <option value="created_at">Sort: Newest</option>
          <option value="next_followup_date">Sort: Follow-Up Date</option>
          <option value="last_contacted_date">Sort: Last Contacted</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#64748b' }}>
          <input type="checkbox" checked={viewAll} onChange={e => setViewAll(e.target.checked)} />
          All reps
        </label>
      </div>

      {loading ? (
        <div style={{ color: '#64748b', padding: 20 }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 40, textAlign: 'center', color: '#64748b',
        }}>
          No leads found. {search ? 'Try a different search.' : 'Add your first lead!'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Lead', 'Vehicle Interest', 'Status', 'Priority', 'Last Contact', 'Next Follow-Up', ''].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', fontSize: 11, fontWeight: 700,
                    color: '#64748b', textAlign: 'left', textTransform: 'uppercase',
                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <LeadRow key={lead.id} lead={lead} isLast={i === filtered.length - 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <AddLeadModal
          repId={currentRep?.id}
          onClose={() => setShowAddForm(false)}
          onDone={() => { setShowAddForm(false); load(); }}
        />
      )}
    </div>
  );
}

function LeadRow({ lead, isLast }) {
  const overdue = lead.overdue_followups > 0;
  return (
    <tr style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
      <td style={{ padding: '12px 16px' }}>
        <Link to={`/leads/${lead.id}`} style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
          {lead.first_name} {lead.last_name}
        </Link>
        {lead.phone && <div style={{ fontSize: 12, color: '#64748b' }}>{lead.phone}</div>}
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Rep: {lead.rep_name}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontSize: 13, color: '#475569', maxWidth: 200 }}>
          {lead.vehicle_interest || '—'}
        </div>
        {lead.vehicle_type && (
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>
            {lead.vehicle_type.replace('-', ' ')}
          </div>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <StatusBadge status={lead.status} />
      </td>
      <td style={{ padding: '12px 16px' }}>
        <PriorityBadge score={lead.priority_score} />
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
        {lead.last_contacted_date
          ? formatDistanceToNow(new Date(lead.last_contacted_date), { addSuffix: true })
          : <span style={{ color: '#dc2626' }}>Never</span>}
      </td>
      <td style={{ padding: '12px 16px' }}>
        {lead.next_followup_date ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: overdue ? 600 : 400, color: overdue ? '#dc2626' : '#0f172a' }}>
              {format(new Date(lead.next_followup_date), 'MMM d, yyyy')}
            </div>
            {overdue && (
              <div style={{ fontSize: 11, color: '#dc2626' }}>
                ⚠️ {lead.overdue_followups} overdue
              </div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>None scheduled</span>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <Link to={`/leads/${lead.id}`} style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
          background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
        }}>View</Link>
      </td>
    </tr>
  );
}

function AddLeadModal({ repId, onClose, onDone }) {
  const { reps } = useApp();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    vehicle_interest: '', vehicle_type: '', budget: '',
    source: 'walk-in', status: 'new', notes: '',
    sales_rep_id: repId || '',
    next_followup_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })(),
  });
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createLead({
        ...form,
        budget: form.budget ? parseInt(form.budget) : null,
        sales_rep_id: parseInt(form.sales_rep_id),
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
        background: '#fff', borderRadius: 16, padding: 28, width: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>+ Add New Lead</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="First Name *" value={form.first_name} onChange={set('first_name')} required />
            <Field label="Last Name *" value={form.last_name} onChange={set('last_name')} required />
            <Field label="Phone" value={form.phone} onChange={set('phone')} type="tel" />
            <Field label="Email" value={form.email} onChange={set('email')} type="email" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Vehicle Type</label>
              <select value={form.vehicle_type} onChange={set('vehicle_type')} style={inputStyle}>
                <option value="">Select type...</option>
                {VEHICLE_TYPES.filter(v => v).map(v => (
                  <option key={v} value={v}>{v.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <Field label="Budget ($)" value={form.budget} onChange={set('budget')} type="number" placeholder="e.g. 12000" />
          </div>

          <Field label="Vehicle Interest (Year/Make/Model)" value={form.vehicle_interest} onChange={set('vehicle_interest')} placeholder="e.g. 2024 Kawasaki Ninja 650" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Lead Source</label>
              <select value={form.source} onChange={set('source')} style={inputStyle}>
                <option value="walk-in">Walk-In</option>
                <option value="phone">Phone Call</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social media">Social Media</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assigned Rep *</label>
              <select value={form.sales_rep_id} onChange={set('sales_rep_id')} style={inputStyle} required>
                <option value="">Select rep...</option>
                {reps.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Field label="First Follow-Up Date" value={form.next_followup_date} onChange={set('next_followup_date')} type="date" />

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              placeholder="Vehicle preferences, budget notes, trade-in details..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#475569', fontSize: 14, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '10px', borderRadius: 8, border: 'none',
              background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>{saving ? 'Adding...' : '+ Add Lead'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, ...props }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
      <input style={inputStyle} required={required} {...props} />
    </div>
  );
}

const VEHICLE_TYPES = ['', 'motorcycle', 'dirt-bike', 'atv', 'utv', 'watercraft', 'snowmobile', 'three-wheeler'];

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a',
  background: '#fff', outline: 'none', marginBottom: 2,
  boxSizing: 'border-box',
};

const selectStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
  fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none', cursor: 'pointer',
};
