import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

import ProtectedRoute from './components/routes/ProtectedRoute';
import RoleRoute from './components/routes/RoleRoute';

// Public pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DoctorsCatalog from './pages/public/DoctorsCatalog';
import DoctorPublicProfile from './pages/public/DoctorPublicProfile';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientDoctors from './pages/patient/PatientDoctors';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments from './pages/patient/MyAppointments';
import AppointmentDetail from './pages/patient/AppointmentDetail';
import PatientProfile from './pages/patient/PatientProfile';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorConsultation from './pages/doctor/DoctorConsultation';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDoctorList from './pages/admin/AdminDoctorList';
import AdminDoctorForm from './pages/admin/AdminDoctorForm';
import AdminAppointments from './pages/admin/AdminAppointments';

function App() {
  return (
    <Routes>
      {/* Public Pages wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorsCatalog />} />
        <Route path="/doctors/:id" element={<DoctorPublicProfile />} />
      </Route>

      {/* Patient Portal Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['patient']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="doctors" element={<PatientDoctors />} />
        <Route path="book/:doctorId" element={<BookAppointment />} />
        <Route path="appointments" element={<MyAppointments />} />
        <Route path="appointments/:id" element={<AppointmentDetail />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      {/* Doctor Portal Routes */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['doctor']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="appointments/:id" element={<DoctorConsultation />} />
        <Route path="profile" element={<DoctorProfile />} />
      </Route>

      {/* Admin Portal Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="doctors" element={<AdminDoctorList />} />
        <Route path="doctors/create" element={<AdminDoctorForm />} />
        <Route path="doctors/:id/edit" element={<AdminDoctorForm />} />
        <Route path="appointments" element={<AdminAppointments />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
