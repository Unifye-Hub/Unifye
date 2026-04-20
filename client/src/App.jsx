import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { Spinner } from './components/Loader';

// Eagerly load the pages that are critical for first paint
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

// Lazy-load everything else — loaded on demand when the user navigates
const SignupPage = lazy(() => import('./pages/SignupPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ParticipantDashboard = lazy(() => import('./pages/ParticipantDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const CreateEventPage = lazy(() => import('./pages/CreateEventPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const LazyFallback = () => (
  <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Spinner />
  </div>
);

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#111827', secondary: '#fff' } },
        }}
      />
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          {/* Auth — no navbar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/auth/select-role" element={<RoleSelectionPage />} />

          {/* Main layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/search" element={<SearchPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="participant">
                  <ParticipantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer"
              element={
                <ProtectedRoute role="organizer">
                  <OrganizerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-event"
              element={
                <ProtectedRoute role="organizer">
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-event/:id"
              element={
                <ProtectedRoute role="organizer">
                  <CreateEventPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
