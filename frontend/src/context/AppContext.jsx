import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentRep, setCurrentRep] = useState(null);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReps = useCallback(async () => {
    try {
      const data = await api.getReps();
      setReps(data);
      if (data.length > 0 && !currentRep) {
        const saved = localStorage.getItem('currentRepId');
        const rep = saved ? data.find(r => r.id === parseInt(saved)) : null;
        setCurrentRep(rep || data[0]);
      }
    } catch (e) {
      console.error('Failed to load reps:', e);
    } finally {
      setLoading(false);
    }
  }, [currentRep]);

  useEffect(() => { loadReps(); }, [loadReps]);

  const switchRep = (rep) => {
    setCurrentRep(rep);
    localStorage.setItem('currentRepId', rep.id);
  };

  return (
    <AppContext.Provider value={{ currentRep, reps, loading, switchRep, loadReps }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
