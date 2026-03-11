# Guide de Déploiement en Production

## Problème 404 lors du rafraîchissement

### Cause
Ton application React utilise le routing côté client (React Router). Quand tu rafraîchis la page sur `/dashboard` ou `/admin`, le serveur cherche un fichier qui n'existe pas.

### Solution

#### Pour Vercel
Le fichier `vercel.json` a été créé à la racine du projet:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Pour Netlify
Le fichier `public/_redirects` a été créé:
```
/*    /index.html   200
```

## Configuration de l'URL du Backend

### 1. Modifier `.env.production`

Remplace l'URL placeholder par ton URL backend réelle:
```env
VITE_API_URL=https://TON-VRAI-BACKEND.vercel.app/api
```

### 2. Configurer les variables d'environnement sur Vercel/Netlify

#### Sur Vercel:
1. Va dans ton projet → Settings → Environment Variables
2. Ajoute:
   - Clé: `VITE_API_URL`
   - Valeur: `https://TON-VRAI-BACKEND.vercel.app/api`
   - Environnement: Production

#### Sur Netlify:
1. Va dans Site settings → Build & deploy → Environment
2. Ajoute:
   - Key: `VITE_API_URL`
   - Value: `https://TON-VRAI-BACKEND.vercel.app/api`

### 3. Configuration CORS sur le Backend

Assure-toi que ton backend autorise ton frontend en production:

```typescript
// Dans ton backend (proxy.ts ou équivalent)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Ajouter l'URL de production
const allowedOrigins = [
  'http://localhost:5173',
  'https://ton-frontend.vercel.app',
  'https://ton-frontend.netlify.app'
];
```

Sur Vercel (Backend), ajoute la variable:
- Clé: `FRONTEND_URL`
- Valeur: `https://ton-frontend.vercel.app`

## Étapes de Déploiement

### 1. Préparer le code
```bash
# Vérifier que tout compile
npm run build

# Vérifier qu'il n'y a pas d'erreurs
npm run lint
```

### 2. Commit et Push
```bash
git add .
git commit -m "Configure production deployment"
git push origin main
```

### 3. Déployer sur Vercel/Netlify

#### Vercel:
```bash
# Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# Déployer
vercel --prod
```

#### Netlify:
```bash
# Installer Netlify CLI (si pas déjà fait)
npm i -g netlify-cli

# Déployer
netlify deploy --prod
```

### 4. Vérifier après déploiement

1. ✅ La page d'accueil charge
2. ✅ Tu peux te connecter
3. ✅ Le dashboard s'affiche
4. ✅ Rafraîchir la page ne donne pas de 404
5. ✅ Les appels API fonctionnent

## Dépannage

### Erreur "Une erreur inattendue s'est produite"

**Causes possibles:**
1. L'URL du backend est incorrecte
2. Le backend n'est pas déployé
3. CORS n'est pas configuré correctement
4. Le backend ne répond pas

**Solution:**
1. Ouvre la console du navigateur (F12)
2. Regarde l'onglet Network
3. Vérifie les appels API qui échouent
4. Vérifie que l'URL appelée est correcte

### Erreur 404 après rafraîchissement

**Solution:**
- Assure-toi que `vercel.json` ou `public/_redirects` est bien présent
- Redéploie l'application

### Les variables d'environnement ne fonctionnent pas

**Solution:**
1. Vérifie que les variables commencent par `VITE_`
2. Redéploie après avoir ajouté les variables
3. Vide le cache du navigateur

## Checklist de Production

- [ ] `.env.production` contient la bonne URL backend
- [ ] Variables d'environnement configurées sur Vercel/Netlify
- [ ] `vercel.json` ou `public/_redirects` présent
- [ ] CORS configuré sur le backend
- [ ] Backend déployé et accessible
- [ ] Frontend déployé
- [ ] Test de connexion
- [ ] Test de rafraîchissement de page
- [ ] Test des fonctionnalités principales

## URLs à configurer

### Frontend
- Développement: `http://localhost:5173`
- Production: `https://TON-FRONTEND.vercel.app` (à remplacer)

### Backend
- Développement: `http://localhost:3001/api`
- Production: `https://TON-BACKEND.vercel.app/api` (à remplacer)
