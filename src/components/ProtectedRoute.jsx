import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullScreenSpinner } from './Spinner';

// Guards a route. `loading` -> spinner (prevents a redirect flash on refresh);
// no session -> bounce to /login. Optional `requireRole` for admin areas; the
// client guard is UX only — the real enforcement is RLS / server-side role checks.
export default function ProtectedRoute({ children, requireRole }) {
  const { session, role, loading } = useAuth();

  if (loading) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (requireRole && role !== requireRole) return <Navigate to="/home" replace />;

  return children;
}
