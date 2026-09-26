import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Cranes from './pages/Cranes/Cranes';
import Operators from './pages/Operators/Operators';
import Riggers from './pages/Riggers/Riggers';
import Attendance from './pages/Attendance/Attendance';
import Sites from './pages/Sites/Sites';
import Assignments from './pages/Assignments/Assignments';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Standard Dashboard & Attendance */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          } />

          {/* Operator & Rigger ID-Prefixed Routes (e.g. /OP-001/dashboard, /RIG-002/attendance) */}
          <Route path="/:idPrefix/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/:idPrefix/attendance" element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          } />

          {/* Admin / Supervisor Only Routes */}
          <Route path="/cranes" element={
            <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
              <Cranes />
            </ProtectedRoute>
          } />

          <Route path="/operators" element={
            <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
              <Operators />
            </ProtectedRoute>
          } />

          <Route path="/riggers" element={
            <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
              <Riggers />
            </ProtectedRoute>
          } />

          <Route path="/sites" element={
            <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
              <Sites />
            </ProtectedRoute>
          } />

          <Route path="/assignments" element={
            <ProtectedRoute allowedRoles={['Admin', 'Supervisor']}>
              <Assignments />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;