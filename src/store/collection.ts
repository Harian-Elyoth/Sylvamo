import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CustomFigure, Entry } from '@/types';

export type Backup = {
  app: 'sylvamo';
  version: 1;
  exportedAt: string;
  entries: Record<string, Entry>;
  customFigures: CustomFigure[];
};

type State = {
  entries: Record<string, Entry>;
  customFigures: CustomFigure[];
  toggleOwned: (id: string) => void;
  toggleWishlist: (id: string) => void;
  setOwnedMany: (ids: string[], owned: boolean) => void;
  updateEntry: (id: string, patch: Partial<Entry>) => void;
  addCustomFigure: (figure: Omit<CustomFigure, 'id'>) => string;
  removeCustomFigure: (id: string) => void;
  restore: (backup: Backup) => void;
  reset: () => void;
};

function isEmpty(entry: Entry): boolean {
  return Object.values(entry).every((v) => v === undefined || v === false || v === '');
}

function withEntry(entries: Record<string, Entry>, id: string, patch: Partial<Entry>) {
  const next = { ...entries[id], ...patch };
  const { [id]: _, ...rest } = entries;
  return isEmpty(next) ? rest : { ...rest, [id]: next };
}

export const useCollection = create<State>()(
  persist(
    (set, get) => ({
      entries: {},
      customFigures: [],
      toggleOwned: (id) => {
        const owned = !get().entries[id]?.owned;
        // Une figurine acquise sort de la liste de souhaits.
        set((s) => ({ entries: withEntry(s.entries, id, owned ? { owned, wishlist: false } : { owned }) }));
      },
      toggleWishlist: (id) => set((s) => ({ entries: withEntry(s.entries, id, { wishlist: !s.entries[id]?.wishlist }) })),
      setOwnedMany: (ids, owned) =>
        set((s) => ({
          entries: ids.reduce(
            (acc, id) => withEntry(acc, id, owned ? { owned, wishlist: false } : { owned }),
            s.entries,
          ),
        })),
      updateEntry: (id, patch) => set((s) => ({ entries: withEntry(s.entries, id, patch) })),
      addCustomFigure: (figure) => {
        const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ customFigures: [...s.customFigures, { ...figure, id }] }));
        return id;
      },
      removeCustomFigure: (id) =>
        set((s) => {
          const { [id]: _, ...entries } = s.entries;
          return { customFigures: s.customFigures.filter((f) => f.id !== id), entries };
        }),
      restore: (backup) => set({ entries: backup.entries, customFigures: backup.customFigures }),
      reset: () => set({ entries: {}, customFigures: [] }),
    }),
    {
      name: 'sylvamo-collection',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ entries: s.entries, customFigures: s.customFigures }),
    },
  ),
);

export function makeBackup(state: Pick<State, 'entries' | 'customFigures'>): Backup {
  return {
    app: 'sylvamo',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: state.entries,
    customFigures: state.customFigures,
  };
}

export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.");
  }
  const b = data as Partial<Backup> | null;
  if (!b || b.app !== 'sylvamo' || typeof b.entries !== 'object' || b.entries === null || !Array.isArray(b.customFigures)) {
    throw new Error("Ce fichier n'est pas une sauvegarde Sylvamo.");
  }
  if (b.version !== 1) {
    throw new Error(`Version de sauvegarde non prise en charge : ${String(b.version)}.`);
  }
  return b as Backup;
}
