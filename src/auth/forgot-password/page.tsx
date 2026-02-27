import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);
    setResetToken(null);

    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message || 'Lien de réinitialisation généré.');
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
    } catch (err) {
      console.error('Erreur mot de passe oublié:', err);
      setError("Impossible d'envoyer le lien de réinitialisation. Vérifiez l'email saisi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToReset = () => {
    if (resetToken) {
      navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
    }
  };

  return (
    <div className="app-body">
      <div className="container" style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit}>
          <h1>Mot de passe oublié</h1>
          <p style={{ marginTop: 0, marginBottom: 10 }}>
            Entrez votre adresse email. Si un compte existe, un lien de réinitialisation sera généré.
          </p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loader" /> Envoi...
              </>
            ) : (
              'Envoyer le lien'
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

          {resetToken && (
            <div style={{ marginTop: 20, fontSize: 12, textAlign: 'left', width: '100%' }}>
              <div style={{ marginBottom: 5, fontWeight: 600 }}>
                Token de réinitialisation (mode développement) :
              </div>
              <code
                style={{
                  display: 'block',
                  padding: '8px 10px',
                  background: '#f4f4f4',
                  borderRadius: 4,
                  wordBreak: 'break-all',
                  fontSize: 11,
                }}
              >
                {resetToken}
              </code>
              <button
                type="button"
                style={{ marginTop: 10, width: '100%' }}
                onClick={handleGoToReset}
              >
                Utiliser ce token pour réinitialiser
              </button>
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

