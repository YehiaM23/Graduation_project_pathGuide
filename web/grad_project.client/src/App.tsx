import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import Home from '@/pages/Home';
import SignIn from '@/pages/auth/SignIn';
import StudentSignIn from '@/pages/auth/StudentSignIn';
import RecruiterSignIn from '@/pages/auth/RecruiterSignIn';
import SignUp from '@/pages/auth/SignUp';
import VerifyEmail from '@/pages/auth/VerifyEmail';
import VerifyPending from '@/pages/auth/VerifyPending';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

// Internships (Public)
import Internships from '@/pages/internships/Internships';
import InternshipDetails from '@/pages/internships/InternshipDetails';

// Static Pages
import About from '@/pages/About';
import Contact from '@/pages/Contact';

// Student Dashboard
import { StudentLayout } from '@/components/StudentLayout';
import StudentDashboard from '@/pages/dashboard/student/Dashboard';
import StudentProfile from '@/pages/dashboard/student/Profile';
import StudentApplications from '@/pages/dashboard/student/Applications';
import CareerPlan from '@/pages/dashboard/student/CareerPlan';
import CourseReviews from '@/pages/dashboard/student/CourseReviews';
import ChangePassword from '@/pages/dashboard/student/ChangePassword';
import PathRecommend from '@/pages/dashboard/student/PathRecommend';
import MockInterview from '@/pages/dashboard/student/MockInterview';

// Admin Dashboard
import AdminSignIn from '@/pages/auth/AdminSignIn';
import { AdminLayout } from '@/components/AdminLayout';
import AdminDashboard from '@/pages/dashboard/admin/AdminDashboard';
import UserManagement from '@/pages/dashboard/admin/UserManagement';
import InternshipManagement from '@/pages/dashboard/admin/InternshipManagement';
import ApplicationOversight from '@/pages/dashboard/admin/ApplicationOversight';
import ContentModeration from '@/pages/dashboard/admin/ContentModeration';
import AdminManagementPage from '@/pages/dashboard/admin/AdminManagement';

// Recruiter Dashboard
import RecruiterDashboard from '@/pages/dashboard/recruiter/Dashboard';
import RecruiterProfile from '@/pages/dashboard/recruiter/Profile';
import MyInternships from '@/pages/dashboard/recruiter/internships/MyInternships';
import NewInternship from '@/pages/dashboard/recruiter/internships/NewInternship';
import EditInternship from '@/pages/dashboard/recruiter/internships/EditInternship';
import InternshipApplications from '@/pages/dashboard/recruiter/internships/Applications';
import AllApplications from '@/pages/dashboard/recruiter/AllApplications';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/student/signin" element={<StudentSignIn />} />
          <Route path="/auth/recruiter/signin" element={<RecruiterSignIn />} />
          <Route path="/auth/admin/signin" element={<AdminSignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/verify-pending" element={<VerifyPending />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Internships (Public) */}
          <Route path="/internships" element={<Internships />} />
          <Route path="/internships/:id" element={<InternshipDetails />} />

          {/* Static Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Student Protected Routes */}
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <StudentDashboard />
                </StudentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <StudentProfile />
                </StudentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <StudentApplications />
                </StudentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/career-plan"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <CareerPlan />
                </StudentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/course-reviews"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <CourseReviews />
                </StudentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/path-recommend"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <PathRecommend />
                </StudentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/mock-interview"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <MockInterview />
                </StudentLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/student/change-password"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentLayout>
                  <ChangePassword />
                </StudentLayout>
              </ProtectedRoute>
            }
          />

          {/* Recruiter Protected Routes */}
          <Route
            path="/dashboard/recruiter"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter/profile"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <RecruiterProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter/internships"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <MyInternships />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter/internships/new"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <NewInternship />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter/internships/:internshipId/edit"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <EditInternship />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter/internships/:internshipId/applications"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <InternshipApplications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/recruiter/applications"
            element={
              <ProtectedRoute allowedRoles={['recruiter']}>
                <AllApplications />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <UserManagement />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/internships"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <InternshipManagement />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <ApplicationOversight />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/reviews"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <ContentModeration />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/admins"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <AdminManagementPage />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Generic dashboard redirect */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
