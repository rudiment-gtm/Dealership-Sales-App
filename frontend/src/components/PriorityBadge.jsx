import React from 'react';

export default function PriorityBadge({ score }) {
  if (score === undefined || score === null) return null;

  let label, color, bg;
  if (score >= 150) { label = 'Critical'; color = '#fff'; bg = '#dc2626'; }
  else if (score >= 100) { label = 'High'; color = '#9a3412'; bg = '#fed7aa'; }
  else if (score >= 60) { label = 'Medium'; color = '#92400e'; bg = '#fef3c7'; }
  else { label = 'Low'; color = '#166534'; bg = '#dcfce7'; }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      color, background: bg,
    }}>
      {score >= 150 ? '🔥' : score >= 100 ? '⚠️' : score >= 60 ? '📌' : '✓'} {label}
    </span>
  );
}
