// Informations d'établissement — à remplacer par les vraies coordonnées
// de Hope Of Life (voir section 35 du cahier des charges) une fois transmises.

export const siteConfig = {
  name: "Hope Of Life",
  tagline: "Bar Lounge & Restaurant de luxe",
  location: "Antraco, Angondjé — Libreville, Gabon",
  description:
    "Hope Of Life, bar lounge et restaurant de luxe à Antraco, Angondjé. Réservez votre table, découvrez notre carte et nos soirées d'exception.",
  address: "Antraco, Angondjé, Libreville, Gabon",
  mapsQuery: "Antraco Angondjé Libreville Gabon",
  phone: "+241 00 00 00 00",
  whatsapp: "+241000000000",
  email: "contact@hopeoflife-gabon.com",
  hours: [
    { day: "Lundi — Jeudi", hours: "18h00 — 00h00" },
    { day: "Vendredi — Samedi", hours: "18h00 — 02h00" },
    { day: "Dimanche", hours: "12h00 — 22h00" },
  ],
  socials: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  },
} as const;
