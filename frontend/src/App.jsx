import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';
import InventoryList from './components/InventoryList';
import Transactions from './components/Transactions';
import Projects from './components/Projects';
import Allocations from './components/Allocations';
import Borrowings from './components/Borrowings';
import Competitions from './components/Competitions';
import LabLayout from './components/LabLayout';

function App() {
  const [token, setTokenState] = useState(localStorage.getItem('token'));

  const setToken = (t) => {
    if (t) {
      localStorage.setItem('token', t);
    } else {
      localStorage.removeItem('token');
    }
    setTokenState(t);
  };

  const ProtectedRoute = ({ children }) => {
    if (!token) return <Navigate to="/" />;
    return <Layout token={token} setToken={setToken}>{children}</Layout>;
  };

  return (
    <Routes>
      <Route path="/" element={<LoginPage setToken={setToken} />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard token={token} setToken={setToken} /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryList token={token} /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Transactions token={token} /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects token={token} /></ProtectedRoute>} />
      <Route path="/allocations" element={<ProtectedRoute><Allocations token={token} /></ProtectedRoute>} />
      <Route path="/borrowings" element={<ProtectedRoute><Borrowings token={token} /></ProtectedRoute>} />
      <Route path="/competitions" element={<ProtectedRoute><Competitions token={token} /></ProtectedRoute>} />
      <Route path="/layout" element={<ProtectedRoute><LabLayout token={token} /></ProtectedRoute>} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
