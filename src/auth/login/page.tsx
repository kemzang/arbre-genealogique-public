import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { useToastContext } from '../../hooks/useToastContext';
import { ButtonLoader } from '../../components/Loader';

export default function LoginPage({onSwitch}: {onSwitch: () => void}) {
  const toast = useToastContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await authService.login({ email, password });
      toast.success('Connexion réussie !');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Erreur de login:', error);
      const errorMsg = error.userMessage || 
        error.response?.data?.message || 
        'Identifiants invalides ou serveur indisponible.';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container sign-in-container">
      <form onSubmit={handleLogin}>
        <h1>Connexion</h1>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="password" 
          placeholder="Mot de passe" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
        {errorMessage && (
          <p className="form-error" style={{ margin: '8px 0 0', fontSize: 13, color: '#c0392b' }}>
            {errorMessage}
          </p>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <ButtonLoader />
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
        <button type="button" className="ghost mobile-only" onClick={onSwitch}>S'inscrire</button>
        <p style={{ margin: '12px 0 0', fontSize: 14 }}>
          Pas encore de compte ?{' '}
          <button type="button" className="link-button" onClick={onSwitch}>
            S'inscrire
          </button>
        </p>
      </form>
    </div>
  )
}
