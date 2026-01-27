
import { useState } from 'react';
import { authService } from '../../services/auth.service';

export default function RegisterPage({onSwitch}: {onSwitch: () => void}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authService.register({ name, email, password });
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      setIsLoading(false);
      onSwitch(); // Switch to login view
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      alert('Erreur lors de l\'inscription (email peut-être déjà utilisé)');
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container sign-up-container">
      <form onSubmit={handleRegister}>
        <h1>Créer un compte</h1>
        <div className="social-container">
            <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
            <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
        </div>
        <span>ou utilisez votre email pour l'inscription</span>
        <input 
          type="text" 
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
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
        <button type="submit" disabled={isLoading}>
            {isLoading ? <><span className="loader"></span> Inscription...</> : 'S\'inscrire'}
        </button>
        <button type="button" className="ghost mobile-only" onClick={onSwitch}>Se connecter</button>
      </form>
    </div>
  )
}
