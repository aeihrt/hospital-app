import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Manage from './pages/Manage';
import Doctors from './pages/Doctors';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorSchedule from './pages/DoctorSchedule';
import DoctorProfile from './pages/DoctorProfile';
import PatientFindDoctors from './pages/PatientFindDoctors';
import PatientAppointments from './pages/PatientAppointments';
import PatientProfile from './pages/PatientProfile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'R001']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/home" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'R001']}>
              <Home />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/appointment"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'R001']}>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'R001']}>
              <Manage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctors"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'R001']}>
              <Doctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'R002']}>
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/schedule"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'R002']}>
              <DoctorSchedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute allowedRoles={['DOCTOR', 'R002']}>
              <DoctorProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/find-doctors"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'R003']}>
              <PatientFindDoctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'R003']}>
              <PatientAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute allowedRoles={['PATIENT', 'R003']}>
              <PatientProfile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;