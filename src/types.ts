export type Collection = {
  id: string;
  name: string;
};

export type FigureSet = {
  id: string;
  /** Numéro de référence du fabricant (ex. "5655"), si connu. */
  ref?: string;
  name: string;
  nameEn?: string;
  collectionId: string;
  species?: string;
  year?: number;
  /** URL d'une photo du set (hébergée sur le wiki, chargée à l'affichage). */
  image?: string;
  custom?: boolean;
};

export type Figure = {
  id: string;
  setId: string;
  name: string;
  role?: string;
  species?: string;
  image?: string;
  custom?: boolean;
};

export type Catalog = {
  version: number;
  generatedAt: string;
  sources: string[];
  collections: Collection[];
  sets: FigureSet[];
  figures: Figure[];
};

export const CONDITIONS = {
  'mint-in-box': 'Neuf en boîte',
  complete: 'Complet',
  'no-box': 'Sans boîte',
  damaged: 'Abîmé',
} as const;

export type Condition = keyof typeof CONDITIONS;

export type Entry = {
  owned?: boolean;
  wishlist?: boolean;
  photoUri?: string;
  condition?: Condition;
  pricePaid?: number;
  acquiredAt?: string;
  notes?: string;
};

export type CustomFigure = {
  id: string;
  name: string;
  collectionId: string;
  setName: string;
  species?: string;
  ref?: string;
};

export type StatusFilter = 'all' | 'owned' | 'missing' | 'wishlist';
