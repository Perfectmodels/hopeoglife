import type { BadgeTone } from "@/components/dashboard/StatusBadge";

type StatusConfig = { label: string; tone: BadgeTone };

export const reservationStatuses: Record<string, StatusConfig> = {
  en_attente: { label: "En attente", tone: "warning" },
  confirmee: { label: "Confirmée", tone: "gold" },
  arrivee: { label: "Arrivée", tone: "info" },
  installee: { label: "Installée", tone: "success" },
  terminee: { label: "Terminée", tone: "neutral" },
  annulee: { label: "Annulée", tone: "danger" },
  absence: { label: "Absence", tone: "danger" },
};

export const tableStatuses: Record<string, StatusConfig> = {
  libre: { label: "Libre", tone: "success" },
  reservee: { label: "Réservée", tone: "gold" },
  occupee: { label: "Occupée", tone: "info" },
  commande_en_cours: { label: "Commande en cours", tone: "warning" },
  commande_prete: { label: "Commande prête", tone: "gold" },
  paiement_demande: { label: "Paiement demandé", tone: "warning" },
  a_nettoyer: { label: "À nettoyer", tone: "danger" },
  indisponible: { label: "Indisponible", tone: "neutral" },
};

export const orderStatuses: Record<string, StatusConfig> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  confirmee: { label: "Confirmée", tone: "gold" },
  transmise: { label: "Transmise", tone: "info" },
  en_preparation: { label: "En préparation", tone: "warning" },
  partiellement_prete: { label: "Partiellement prête", tone: "warning" },
  prete: { label: "Prête", tone: "success" },
  servie: { label: "Servie", tone: "info" },
  en_attente_paiement: { label: "En attente de paiement", tone: "warning" },
  payee: { label: "Payée", tone: "success" },
  annulee: { label: "Annulée", tone: "danger" },
  remboursee: { label: "Remboursée", tone: "danger" },
};

export const orderItemStatuses: Record<string, StatusConfig> = {
  recu: { label: "Reçu", tone: "neutral" },
  en_preparation: { label: "En préparation", tone: "warning" },
  pret: { label: "Prêt", tone: "success" },
  servi: { label: "Servi", tone: "info" },
  indisponible: { label: "Indisponible", tone: "danger" },
};

export const stockMovementTypes: Record<string, StatusConfig> = {
  entree: { label: "Entrée", tone: "success" },
  sortie: { label: "Sortie", tone: "info" },
  perte: { label: "Perte", tone: "danger" },
  ajustement: { label: "Ajustement", tone: "warning" },
  inventaire: { label: "Inventaire", tone: "neutral" },
};

export const paymentMethodLabels: Record<string, string> = {
  especes: "Espèces",
  carte: "Carte bancaire",
  mobile_money: "Mobile Money",
  virement: "Virement",
  en_ligne: "En ligne",
  mixte: "Mixte",
  offert: "Offert",
};

export const activityActionLabels: Record<string, string> = {
  "auth.login": "Connexion (e-mail)",
  "auth.pin_login": "Connexion (PIN)",
  "auth.logout": "Déconnexion",
  "reservation.status_update": "Statut de réservation modifié",
  "order.transfer_table": "Transfert de table",
};

export function toOptions(config: Record<string, StatusConfig>) {
  return Object.entries(config).map(([value, { label }]) => ({ value, label }));
}
