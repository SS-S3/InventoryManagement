import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const token = localStorage.getItem('token');
  return (
    <Routes>
      <Route path="/login" element={<Login setToken={t => localStorage.setItem('token', t)} />} />
      <Route path="/*" element={token ? <Dashboard token={token} setToken={t => localStorage.setItem('token', t)} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
