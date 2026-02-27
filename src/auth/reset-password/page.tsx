import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    if (password.length < 8) {
      setIsLoading(false);
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    try {
      const response = await authService.resetPassword({ token, password });
      setMessage(response.message || 'Mot de passe mis à jour avec succès.');

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Erreur réinitialisation mot de passe:', err);
      setError('Impossible de réinitialiser le mot de passe. Le lien est peut-être expiré ou invalide.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-body">
      <div className="container" style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit}>
          <h1>Réinitialiser le mot de passe</h1>
          <p style={{ marginTop: 0, marginBottom: 10 }}>
            Saisissez le token reçu et votre nouveau mot de passe.
          </p>

          <input
            type="text"
            placeholder="Token de réinitialisation"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={isLoading}
            required
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe (min. 8 caractères)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loader" /> Réinitialisation...
              </>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>

          {message && (
            <div style={{ marginTop: 15, fontSize: 12, color: '#326C58' }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 15, fontSize: 12, color: '#c0392b' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <Link to="/">Retour à la connexion</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

