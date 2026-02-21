import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FollowUpQueue from './pages/FollowUpQueue';
import LeadList from './pages/LeadList';
import LeadDetail from './pages/LeadDetail';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/queue" element={<FollowUpQueue />} />
            <Route path="/leads" element={<LeadList />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}
