import barMenuCatalog from "../../data/bar-menu.json";

// Données affichées tant que Supabase n'est pas connecté
// (voir isSupabaseConfigured dans lib/supabase/env.ts) ou que les tables
// sont encore vides. La carte du bar ci-dessous provient de la carte
// physique Hope Of Life transmise le 28 juillet 2026.

export type DemoMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  allergens?: string[];
  isDailySpecial?: boolean;
  isOrderable?: boolean;
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

function stableCatalogUuid(scope: "category" | "item", index: number) {
  const prefix = scope === "category" ? "ba100000" : "ba200000";
  return `${prefix}-0000-4000-8000-${String(index).padStart(12, "0")}`;
}

let barItemIndex = 0;

export const demoBarMenu: DemoMenuCategory[] = barMenuCatalog.categories.map(
  (category, categoryIndex) => ({
    id: stableCatalogUuid("category", categoryIndex + 1),
    name: category.name,
    items: category.items.map((item) => {
      barItemIndex += 1;
      const service = "service" in item ? item.service : category.service;
      return {
        id: stableCatalogUuid("item", barItemIndex),
        name: item.name,
        description:
          "description" in item
            ? item.description
            : service === "Bouteille"
              ? "Bouteille."
              : service === "Shot"
                ? "Shot."
                : "Servi au verre.",
        price: item.price,
        isOrderable: false,
      };
    }),
  })
);

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
