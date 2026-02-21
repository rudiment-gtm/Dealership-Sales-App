import React from 'react';

const STATUS_CONFIG = {
  new:         { label: 'New',         color: '#1d4ed8', bg: '#dbeafe' },
  contacted:   { label: 'Contacted',   color: '#0369a1', bg: '#e0f2fe' },
  interested:  { label: 'Interested',  color: '#0f766e', bg: '#ccfbf1' },
  quoted:      { label: 'Quoted',      color: '#7c3aed', bg: '#ede9fe' },
  negotiating: { label: 'Negotiating', color: '#9a3412', bg: '#fed7aa' },
  won:         { label: 'Won ✓',       color: '#166534', bg: '#dcfce7' },
  lost:        { label: 'Lost',        color: '#64748b', bg: '#f1f5f9' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
