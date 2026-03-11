# 🐛 Déboguer l'erreur "Oups ! Une erreur s'est produite"

## Comment voir l'erreur exacte

1. **Ouvre la console du navigateur**:
   - Chrome/Edge: `F12` ou `Ctrl+Shift+I`
   - Firefox: `F12` ou `Ctrl+Shift+K`
   - Safari: `Cmd+Option+I`

2. **Va dans l'onglet "Console"**

3. **Rafraîchis la page** (`F5` ou `Ctrl+R`)

4. **Cherche les erreurs en rouge** - Elles te diront exactement quel est le problème

## Erreurs courantes et solutions

### 1. Erreur réseau / API

**Symptôme**: 
```
Failed to fetch
Network Error
ERR_CONNECTION_REFUSED
```

**Cause**: Le backend n'est pas accessible

**Solution**:
- Vérifie que l'URL dans `.env.production` est correcte
- Vérifie que le backend est déployé et fonctionne
- Teste l'URL du backend directement dans le navigateur

### 2. Erreur CORS

**Symptôme**:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Cause**: Le backend n'autorise pas ton frontend

**Solution**:
- Configure `FRONTEND_URL` sur le backend avec l'URL de ton frontend
- Redéploie le backend

### 3. Erreur 401 Unauthorized

**Symptôme**:
```
401 Unauthorized
```

**Cause**: Le token d'authentification est invalide ou expiré

**Solution**:
- Déconnecte-toi et reconnecte-toi
- Vide le localStorage: `localStorage.clear()` dans la console

### 4. Erreur de données

**Symptôme**:
```
Cannot read property 'xxx' of undefined
TypeError: xxx is not a function
```

**Cause**: Les données reçues du backend ne sont pas au bon format

**Solution**:
- Vérifie que le backend et le frontend sont à jour
- Vérifie les logs du backend

## Commandes de débogage dans la console

### Vérifier l'URL du backend
```javascript
console.log(import.meta.env.VITE_API_URL);
```

### Vérifier l'utilisateur connecté
```javascript
console.log(localStorage.getItem('user'));
console.log(localStorage.getItem('token'));
```

### Vider le cache
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Tester l'API manuellement
```javascript
fetch('https://ton-backend.vercel.app/api/member/status', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Checklist de débogage

- [ ] La console montre l'erreur exacte
- [ ] L'URL du backend est correcte
- [ ] Le backend est accessible (teste dans le navigateur)
- [ ] CORS est configuré sur le backend
- [ ] L'utilisateur est bien connecté (token valide)
- [ ] Les données du localStorage sont valides

## Si rien ne fonctionne

1. **Vide complètement le cache**:
   - Chrome: `Ctrl+Shift+Delete` → Tout effacer
   - Ou dans la console: `localStorage.clear()`

2. **Redémarre en mode incognito** pour tester sans cache

3. **Vérifie les logs du backend** sur Vercel/Netlify

4. **Teste le backend directement** avec Postman ou curl

## Améliorations apportées

✅ Meilleure gestion d'erreur dans `initializeFamilies`
✅ Ajout de `finally` pour toujours arrêter le loading
✅ Meilleur logging des erreurs
✅ Le bouton "Réessayer" recharge maintenant la page complètement
