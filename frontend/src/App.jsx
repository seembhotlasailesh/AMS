import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';

import AdminDashboard from './pages/admin/Dashboard';
import ManageColleges from './pages/admin/Colleges';
import ManageCollegeAdmins from './pages/admin/CollegeAdmins';
import ManageFaculty from './pages/admin/Faculty';
import ManageStudents from './pages/admin/Students';
import ManageSubjects from './pages/shared/Subjects';

import FacultyDashboard from './pages/faculty/Dashboard';
import MarkAttendance from './pages/faculty/MarkAttendance';
import LeaveRequests from './pages/faculty/LeaveRequests';
import Marks from './pages/faculty/Marks';

import StudentDashboard from './pages/student/Dashboard';
import ApplyLeave from './pages/student/ApplyLeave';
import MyAttendance from './pages/student/MyAttendance';
import Performance from './pages/student/Performance';
import { roleHomePath } from './utils/roles';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // Let AuthProvider handle loading state UI

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={roleHomePath(user.role)} />} />

      {/* Main Admin Routes */}
      <Route path="/main-admin" element={<Layout allowedRoles={['MAIN_ADMIN', 'ADMIN']} />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="colleges" element={<ManageColleges />} />
        <Route path="college-admins" element={<ManageCollegeAdmins />} />
        <Route path="faculty" element={<ManageFaculty />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="subjects" element={<ManageSubjects />} />
      </Route>

      {/* Legacy Admin Routes */}
      <Route path="/admin" element={<Layout allowedRoles={['MAIN_ADMIN', 'ADMIN']} />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="colleges" element={<ManageColleges />} />
        <Route path="faculty" element={<ManageFaculty />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="subjects" element={<ManageSubjects />} />
      </Route>

      {/* College Admin Routes */}
      <Route path="/college-admin" element={<Layout allowedRoles={['COLLEGE_ADMIN']} />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="faculty" element={<ManageFaculty />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="subjects" element={<ManageSubjects />} />
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty" element={<Layout allowedRoles={['FACULTY']} />}>
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="subjects" element={<ManageSubjects />} />
        <Route path="marks" element={<Marks />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="leaves" element={<LeaveRequests />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<Layout allowedRoles={['STUDENT']} />}>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="performance" element={<Performance />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="leaves" element={<ApplyLeave />} />
      </Route>

      {/* Base Redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
