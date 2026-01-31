import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function LoginPage({onSwitch}: {onSwitch: () => void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.login({ email, password });
      // alert('Connexion réussie !'); // Moins intrusif de rediriger directement
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur de login:', error);
      alert('Identifiants invalides');
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
        <a href="#">Mot de passe oublié ?</a>
        <button type="submit" disabled={isLoading}>
          {isLoading ? <><span className="loader"></span> Connexion...</> : 'Se connecter'}
        </button>
        <button type="button" className="ghost mobile-only" onClick={onSwitch}>S'inscrire</button>
      </form>
    </div>
  )
}
