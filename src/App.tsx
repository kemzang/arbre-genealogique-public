import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss'
import RegisterPage from './auth/register/page'
import LoginPage from './auth/login/page'
import ForgotPasswordPage from './auth/forgot-password/page'
import ResetPasswordPage from './auth/reset-password/page'
import DashboardPage from './pages/dashboard/page'
import AdminDashboard from './pages/admin/AdminDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './contexts/ToastContext.tsx'
import { Loader } from './components/Loader'
import { authService, type User } from './services/auth.service';

function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true)

  // Rediriger si déjà connecté
  if (authService.getCurrentUser()) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className='app-body'>
      <div className={`container ${!isSignIn ? 'right-panel-active' : ''}`} id="container">
        <RegisterPage onSwitch={() => setIsSignIn(true)} />
        <LoginPage onSwitch={() => setIsSignIn(false)} />
        
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Bienvenue !</h1>
              <p>Pour rester connecté avec nous, veuillez vous connecter avec vos informations personnelles</p>
              <button className="ghost" onClick={() => setIsSignIn(true)}>Se connecter</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Salut, l'ami !</h1>
              <p>Entrez vos détails personnels et commencez votre voyage avec nous</p>
              <button className="ghost" onClick={() => setIsSignIn(false)}>S'inscrire</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Use a small delay to ensure localStorage is fully loaded
    const checkUser = () => {
      console.log('SuperAdminRoute - Checking user authentication...');
      
      // Validate and fix user data if needed
      const validatedUser = authService.validateAndFixUserData();
      console.log('SuperAdminRoute - Validated user:', validatedUser);
      
      setUser(validatedUser);
      setIsLoading(false);
    };
    
    // Small delay to ensure localStorage is ready
    setTimeout(checkUser, 100);
  }, []);
  
  if (isLoading) {
    return <Loader size="large" text="Vérification des permissions..." fullScreen />;
  }
  
  if (!user) {
    console.log('SuperAdminRoute - No user, redirecting to /');
    return <Navigate to="/" replace />;
  }
  
  const isSuper = authService.isSuperAdmin(user);
  console.log('SuperAdminRoute - isSuperAdmin result:', isSuper);
  
  if (!isSuper) {
    console.log('SuperAdminRoute - Not super admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('SuperAdminRoute - Access granted to admin dashboard');
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <DashboardPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <SuperAdminRoute>
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              </SuperAdminRoute>
            } 
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
