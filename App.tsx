
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentPage from './pages/StudentPage';
import { useAuth } from './hooks/useAuth';

const App: React.FC = () => {
  const { auth, login, logout } = useAuth();

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={auth.isLoggedIn ? <Navigate to="/dashboard" /> : <LoginPage onLogin={login} />} 
        />
        <Route 
          path="/dashboard" 
          element={auth.isLoggedIn ? <DashboardPage teacherId={auth.teacherId!} username={auth.username!} onLogout={logout} /> : <Navigate to="/login" />} 
        />
        <Route path="/s/:teacherId" element={<StudentPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
