import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FigureSet } from '@/types';

/**
 * Photos des sets chargées depuis le Sylvanian Families Wiki, directement par le téléphone :
 * on demande à l'API MediaWiki la vignette de la page qui porte le nom anglais du set,
 * puis on garde l'adresse en mémoire (l'image elle-même est mise en cache par expo-image).
 */
export const WIKI_API = 'https://sylvanianfamilies.fandom.com/api.php';
const IMAGE_SIZE = 400;
const BATCH_SIZE = 50;
/** Un set sans photo sur le wiki est revérifié au bout d'une semaine. */
const RETRY_MISSING_MS = 7 * 24 * 3600 * 1000;

type PageImagesResponse = {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: { title: string; thumbnail?: { source: string } }[];
  };
};

/** Associe chaque titre demandé à l'URL de sa vignette, en suivant normalisations et redirections. */
export function extractPageImages(data: PageImagesResponse): Map<string, string> {
  const aliases = new Map<string, string>();
  for (const r of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) aliases.set(r.from, r.to);
  const images = new Map<string, string>();
  for (const page of data.query?.pages ?? []) {
    if (page.thumbnail?.source) images.set(page.title, page.thumbnail.source);
  }
  const out = new Map<string, string>();
  for (const title of new Set([...aliases.keys(), ...images.keys()])) {
    let t = title;
    for (let i = 0; i < 5 && aliases.has(t); i++) t = aliases.get(t)!;
    const url = images.get(t);
    if (url) out.set(title, url);
  }
  return out;
}

type Found = { url?: string; checkedAt: number };

type WikiImagesState = {
  found: Record<string, Found>;
  save: (results: Record<string, Found>) => void;
};

export const useWikiImages = create<WikiImagesState>()(
  persist(
    (set) => ({
      found: {},
      save: (results) => set((s) => ({ found: { ...s.found, ...results } })),
    }),
    {
      name: 'sylvamo-wiki-images',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ found: s.found }),
    },
  ),
);

const queued = new Set<string>();
const inFlight = new Set<string>();
/** Titres dont la requête a échoué (hors ligne…) : on ne réessaie qu'au prochain lancement. */
const failed = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function needsLookup(title: string): boolean {
  if (queued.has(title) || inFlight.has(title) || failed.has(title)) return false;
  const found = useWikiImages.getState().found[title];
  return !found || (!found.url && Date.now() - found.checkedAt > RETRY_MISSING_MS);
}

async function fetchBatch(titles: string[]) {
  titles.forEach((t) => inFlight.add(t));
  try {
    const params = new URLSearchParams({
      action: 'query',
      prop: 'pageimages',
      piprop: 'thumbnail',
      pithumbsize: String(IMAGE_SIZE),
      redirects: '1',
      titles: titles.join('|'),
      format: 'json',
      formatversion: '2',
      origin: '*',
    });
    const res = await fetch(`${WIKI_API}?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const images = extractPageImages(await res.json());
    const checkedAt = Date.now();
    useWikiImages.getState().save(Object.fromEntries(titles.map((t) => [t, { url: images.get(t), checkedAt }])));
  } catch {
    titles.forEach((t) => failed.add(t));
  } finally {
    titles.forEach((t) => inFlight.delete(t));
  }
}

async function flush() {
  timer = null;
  const titles = [...queued];
  queued.clear();
  for (let i = 0; i < titles.length; i += BATCH_SIZE) await fetchBatch(titles.slice(i, i + BATCH_SIZE));
}

/** Demande la photo d'une page ; les demandes faites au même moment partent en une seule requête. */
export function requestWikiImage(title: string) {
  if (!needsLookup(title)) return;
  queued.add(title);
  timer ??= setTimeout(flush, 50);
}

/** Photo d'un set : celle du catalogue si elle existe, sinon celle trouvée sur le wiki. */
export function useSetImage(set: FigureSet | undefined): string | undefined {
  const title = !set?.image && !set?.custom ? set?.nameEn : undefined;
  const url = useWikiImages((s) => (title ? s.found[title]?.url : undefined));
  useEffect(() => {
    if (title) requestWikiImage(title);
  }, [title]);
  return set?.image ?? url;
}
