# 🚀 Guide de Déploiement Rapide

## ⚠️ Problème 404 en Production - SOLUTION

Si tu obtiens une erreur 404 quand tu rafraîchis la page en production, c'est normal! Voici comment le corriger:

### Solution Rapide

Les fichiers suivants ont été créés pour toi:
- ✅ `vercel.json` - Pour Vercel
- ✅ `public/_redirects` - Pour Netlify

**Il suffit de redéployer ton application!**

```bash
git add .
git commit -m "Fix 404 on page refresh"
git push origin main
```

## 🔧 Configuration de l'URL Backend

### Étape 1: Modifier `.env.production`

Ouvre le fichier `.env.production` et remplace:
```env
VITE_API_URL=https://ton-backend.vercel.app/api
```

Par ton URL backend réelle:
```env
VITE_API_URL=https://TON-VRAI-BACKEND.vercel.app/api
```

### Étape 2: Configurer sur Vercel/Netlify

#### Sur Vercel:
1. Va dans ton projet
2. Settings → Environment Variables
3. Ajoute `VITE_API_URL` avec ton URL backend
4. Redéploie

#### Sur Netlify:
1. Site settings → Build & deploy → Environment
2. Ajoute `VITE_API_URL` avec ton URL backend
3. Redéploie

### Étape 3: Configurer CORS sur le Backend

Sur ton backend (Vercel), ajoute la variable:
- Clé: `FRONTEND_URL`
- Valeur: `https://ton-frontend.vercel.app`

## 📝 Checklist

- [ ] Modifier `.env.production` avec la vraie URL backend
- [ ] Ajouter `VITE_API_URL` sur Vercel/Netlify
- [ ] Configurer `FRONTEND_URL` sur le backend
- [ ] Redéployer le frontend
- [ ] Tester: connexion, dashboard, rafraîchissement

## 🆘 Besoin d'aide?

Consulte le guide détaillé: `.gemini/DEPLOIEMENT_PRODUCTION.md`
