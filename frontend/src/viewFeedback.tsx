import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminDashboard } from './components/AdminDashboard';
import './styles/giveFeedback.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminDashboard />
  </React.StrictMode>
);