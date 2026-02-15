import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCurrentUser } from '@/store/authSlice';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAppSelector((s) => s.auth);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((s) => s.auth);

  // On mount, if we have a token but no user, fetch user info
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [token, user, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Protected routes with URL-based project/chat navigation */}
      <Route
        path="/chat/:projectId"
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      />
      <Route
        path="/chat"
        element={
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        }
      />

      {/* Default redirect: / → /chat */}
      <Route path="/" element={<Navigate to="/chat" replace />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
