// Constante pure, sans dépendance Node — importable depuis le middleware (Edge
// runtime) comme depuis le code serveur Node. La vérification cryptographique
// complète du cookie vit dans pin-session.ts (crypto Node, Server-only).
export const PIN_SESSION_COOKIE = "hol_pin_session";
