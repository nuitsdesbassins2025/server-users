self.addEventListener('install', event => {
  console.log('Service Worker installé');
  // on peut mettre en cache des fichiers ici
});

self.addEventListener('fetch', event => {
  // on peut intercepter les requêtes si besoin
});
