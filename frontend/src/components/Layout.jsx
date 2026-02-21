import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV = [
  { path: '/', label: 'Dashboard', icon: '⚡' },
  { path: '/queue', label: 'Follow-Up Queue', icon: '📋' },
  { path: '/leads', label: 'All Leads', icon: '👥' },
];

export default function Layout({ children }) {
  const { currentRep, reps, switchRep } = useApp();
  const location = useLocation();
  const [repMenuOpen, setRepMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#0f172a', color: '#e2e8f0',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
            ⚡ PowerTrack
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Sales Follow-Up CRM
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV.map(({ path, label, icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? '#fff' : '#94a3b8',
                background: active ? '#1e3a5f' : 'transparent',
                borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
                transition: 'all 0.15s',
                textDecoration: 'none',
              }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Rep selector */}
        <div style={{ padding: 16, borderTop: '1px solid #1e293b', position: 'relative' }}>
          <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Rep
          </div>
          <button
            onClick={() => setRepMenuOpen(!repMenuOpen)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 8, padding: '8px 12px', color: '#e2e8f0',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#2563eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {currentRep?.name?.charAt(0) || '?'}
            </div>
            <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentRep?.name || 'Select Rep'}
            </span>
            <span style={{ fontSize: 10 }}>{repMenuOpen ? '▲' : '▼'}</span>
          </button>

          {repMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 16, right: 16,
              background: '#1e293b', border: '1px solid #334155',
              borderRadius: 8, overflow: 'hidden', marginBottom: 4,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
            }}>
              {reps.map(rep => (
                <button
                  key={rep.id}
                  onClick={() => { switchRep(rep); setRepMenuOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: rep.id === currentRep?.id ? '#2563eb22' : 'transparent',
                    border: 'none', color: '#e2e8f0', fontSize: 13, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{rep.name.charAt(0)}</div>
                  {rep.name}
                </button>
              ))}
              <Link
                to="/settings"
                onClick={() => setRepMenuOpen(false)}
                style={{
                  display: 'block', padding: '10px 12px', fontSize: 12,
                  color: '#64748b', borderTop: '1px solid #334155',
                  textAlign: 'center',
                }}
              >
                + Add / Manage Reps
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', background: '#f1f5f9' }}>
        {children}
      </main>
    </div>
  );
}
