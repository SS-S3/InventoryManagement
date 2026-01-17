import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';

function App() {
  const token = localStorage.getItem('token');
  const setToken = t => { if (t) localStorage.setItem('token', t); else localStorage.removeItem('token') }
  return (
    <Routes>
      <Route path="/login" element={<Login setToken={setToken} />} />
      <Route
        path="/*"
        element={token ? <Layout token={token} setToken={setToken}><Dashboard token={token} setToken={setToken} /></Layout> : <Navigate to="/login" />}
      />
    </Routes>
  );
}

export default App;
