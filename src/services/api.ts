import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs de manière conviviale
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Messages d'erreur conviviaux
    const userFriendlyMessages: Record<string, string> = {
      'Network Error': 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
      'timeout': 'La requête a pris trop de temps. Veuillez réessayer.',
      '400': 'Les données envoyées sont invalides.',
      '401': 'Vous devez vous connecter pour accéder à cette ressource.',
      '403': 'Vous n\'avez pas les permissions nécessaires.',
      '404': 'La ressource demandée n\'existe pas.',
      '409': 'Cette action est en conflit avec les données existantes.',
      '500': 'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.',
      '502': 'Le serveur est temporairement indisponible.',
      '503': 'Le service est temporairement indisponible.',
    };

    let userMessage = 'Une erreur inattendue s\'est produite.';

    if (error.response) {
      // Erreur avec réponse du serveur
      const status = error.response.status.toString();
      userMessage = userFriendlyMessages[status] || userMessage;

      // Si le backend envoie un message personnalisé
      if (error.response.data?.message) {
        userMessage = error.response.data.message;
      }
    } else if (error.request) {
      // Erreur réseau
      userMessage = userFriendlyMessages['Network Error'];
    } else if (error.message) {
      // Autres erreurs
      userMessage = userFriendlyMessages[error.message] || userMessage;
    }

    // Créer un objet d'erreur enrichi
    const enrichedError = {
      ...error,
      userMessage,
      originalError: error.message,
    };

    return Promise.reject(enrichedError);
  }
);

export default api;
