import React, { useState } from 'react';
import { api } from '../api';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { reps, loadReps, switchRep, currentRep } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAddRep = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const rep = await api.createRep({ name, email });
      await loadReps();
      switchRep(rep);
      setName('');
      setEmail('');
      setMsg(`✅ Added ${rep.name} successfully!`);
    } catch (err) {
      setMsg(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: '#0f172a' }}>⚙️ Settings</h1>
      <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 14 }}>Manage sales reps</p>

      {/* Existing reps */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 24, boxShadow: 'var(--shadow)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>Sales Reps ({reps.length})</h2>
        {reps.map(rep => (
          <div key={rep.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{rep.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{rep.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{rep.email}</div>
            </div>
            {rep.id === currentRep?.id && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 999 }}>
                Active
              </span>
            )}
            <button onClick={() => switchRep(rep)} style={{
              padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#475569', fontSize: 12, cursor: 'pointer',
            }}>Switch</button>
          </div>
        ))}
      </div>

      {/* Add rep */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>+ Add Sales Rep</h2>
        <form onSubmit={handleAddRep}>
          <label style={labelStyle}>Full Name *</label>
          <input
            value={name} onChange={e => setName(e.target.value)} required
            placeholder="Jane Smith"
            style={inputStyle}
          />
          <label style={labelStyle}>Email *</label>
          <input
            value={email} onChange={e => setEmail(e.target.value)} required type="email"
            placeholder="jane@dealership.com"
            style={inputStyle}
          />
          {msg && <div style={{ fontSize: 13, marginBottom: 10, color: msg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>{msg}</div>}
          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: '#2563eb', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>{saving ? 'Adding...' : '+ Add Rep'}</button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#475569',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
};

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, color: '#0f172a',
  background: '#fff', outline: 'none', marginBottom: 12,
  boxSizing: 'border-box',
};
