import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.scss'
import RegisterPage from './auth/register/page'
import LoginPage from './auth/login/page'
import DashboardPage from './pages/dashboard/page'
import { authService } from './services/auth.service';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
