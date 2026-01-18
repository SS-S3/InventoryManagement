import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './components/Dashboard';
import Layout from './components/Layout';

function App() {
  const token = localStorage.getItem('token');
  const setToken = t => { if (t) localStorage.setItem('token', t); else localStorage.removeItem('token') }
  return (
    <Routes>
      <Route path="/" element={<LoginPage setToken={setToken} />} />
      <Route
        path="/dashboard"
        element={token ? <Layout token={token} setToken={setToken}><Dashboard token={token} setToken={setToken} /></Layout> : <Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;
