// Environnement de test « dev » : API du backend de dev (base de dev), jamais la production.
// Accès par l'adresse IP du serveur et un port, sans nom de domaine : le port 8090 sert le
// dashboard de dev et relaie /api et /uploads vers le backend de dev.
export const environment = {
  production: true,
  apiUrl: 'http://13.140.148.8:8090/api',
  // Base des photos de produits enregistrées en chemin relatif (/uploads/…).
  uploadsUrl: 'http://13.140.148.8:8090',
  appVersion: '0.1.2',
};
