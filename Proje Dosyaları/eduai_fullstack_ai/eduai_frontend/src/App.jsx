import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import ExamSelection from './pages/ExamSelection.jsx';
import Questionnaire from './pages/Questionnaire.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MiniTest from './pages/MiniTest.jsx';
import WeeklyPlan from './pages/WeeklyPlan.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';

// Simple auth guard component
const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/exams"
            element={
              <RequireAuth>
                <ExamSelection />
              </RequireAuth>
            }
          />
          <Route
            path="/questionnaire"
            element={
              <RequireAuth>
                <Questionnaire />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/mini-test"
            element={
              <RequireAuth>
                <MiniTest />
              </RequireAuth>
            }
          />
          <Route
            path="/weekly-plan"
            element={
              <RequireAuth>
                <WeeklyPlan />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          }
        />
        </Routes>
      </div>
    </div>
  );
}