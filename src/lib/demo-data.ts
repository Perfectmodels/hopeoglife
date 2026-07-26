// Données de démonstration affichées tant que Supabase n'est pas connecté
// (voir isSupabaseConfigured dans lib/supabase/env.ts) ou que les tables
// sont encore vides. À remplacer par le vrai menu / les vrais événements
// une fois saisis dans le tableau de bord.

export type DemoMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  allergens?: string[];
  isDailySpecial?: boolean;
};

export type DemoMenuCategory = {
  id: string;
  name: string;
  items: DemoMenuItem[];
};

export const demoRestaurantMenu: DemoMenuCategory[] = [
  {
    id: "entrees",
    name: "Entrées",
    items: [
      {
        id: "e1",
        name: "Tartare de daurade, agrumes & huile d'olive",
        description: "Daurade fraîche, zestes d'agrumes, coriandre, huile d'olive vierge",
        price: 8500,
        imageUrl: "/menu/e1.jpg",
      },
      {
        id: "e2",
        name: "Velouté de gombo façon lounge",
        description: "Gombo, crème légère, éclats de crevettes fumées",
        price: 6500,
        imageUrl: "/menu/e2.jpg",
      },
    ],
  },
  {
    id: "plats",
    name: "Plats",
    items: [
      {
        id: "p1",
        name: "Filet de bœuf, sauce poivre vert",
        description: "Filet de bœuf grillé, pommes fondantes, sauce poivre vert",
        price: 18500,
        imageUrl: "/menu/p1.jpg",
        isDailySpecial: true,
      },
      {
        id: "p2",
        name: "Poulet DG revisité",
        description: "Poulet fermier, plantain, légumes croquants, sauce maison",
        price: 14500,
        imageUrl: "/menu/p2.jpg",
      },
    ],
  },
  {
    id: "grillades",
    name: "Grillades",
    items: [
      {
        id: "g1",
        name: "Brochettes de gambas grillées",
        description: "Gambas marinées, citronnelle, gingembre",
        price: 16500,
        imageUrl: "/menu/g1.jpg",
      },
    ],
  },
  {
    id: "desserts",
    name: "Desserts",
    items: [
      {
        id: "d1",
        name: "Fondant chocolat, cœur coulant",
        description: "Chocolat grand cru, glace vanille Bourbon",
        price: 6000,
        imageUrl: "/menu/d1.jpg",
      },
    ],
  },
];

export const demoBarMenu: DemoMenuCategory[] = [
  {
    id: "cocktails",
    name: "Cocktails signature",
    items: [
      {
        id: "c1",
        name: "Hope Sunset",
        description: "Rhum ambré, passion, gingembre, citron vert",
        price: 7500,
        imageUrl: "/menu/c1.jpg",
        isDailySpecial: true,
      },
      {
        id: "c2",
        name: "Lounge Gold",
        description: "Gin, champagne, sirop de fleur d'oranger, feuille d'or",
        price: 9000,
        imageUrl: "/menu/c2.jpg",
      },
    ],
  },
  {
    id: "champagnes",
    name: "Champagnes & Vins",
    items: [
      { id: "v1", name: "Champagne Moët & Chandon", description: "Bouteille 75cl", price: 85000, imageUrl: "/menu/v1.jpg" },
      { id: "v2", name: "Vin rouge, sélection Hope Of Life", description: "Verre", price: 5500, imageUrl: "/menu/v2.jpg" },
    ],
  },
  {
    id: "mocktails",
    name: "Mocktails",
    items: [
      {
        id: "m1",
        name: "Garden Fresh",
        description: "Concombre, menthe, citron vert, eau pétillante",
        price: 4500,
        imageUrl: "/menu/m1.jpg",
      },
    ],
  },
];

export type DemoEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  priceInfo: string;
};

export const demoEvents: DemoEvent[] = [
  {
    id: "ev1",
    title: "Soirée Lounge — Live Sax",
    description: "Une soirée feutrée au son du saxophone, cocktails signature et ambiance dorée.",
    date: "2026-08-01",
    time: "20h00",
    priceInfo: "Entrée libre, sur réservation",
  },
  {
    id: "ev2",
    title: "Brunch Dominical",
    description: "Buffet raffiné, mocktails et animation musicale douce en famille ou entre amis.",
    date: "2026-08-09",
    time: "12h00",
    priceInfo: "25 000 XAF / personne",
  },
];

export const galleryPlaceholders = [
  { id: "g1", label: "Salle principale" },
  { id: "g2", label: "Bar & mixologie" },
  { id: "g3", label: "Terrasse lounge" },
  { id: "g4", label: "Espace VIP" },
  { id: "g5", label: "Nos plats" },
  { id: "g6", label: "Nos cocktails" },
  { id: "g7", label: "Soirées à thème" },
  { id: "g8", label: "Coucher de soleil" },
];
