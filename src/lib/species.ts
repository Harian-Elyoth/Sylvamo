import { normalize } from '@/lib/filter';

const EMOJI: [string, string][] = [
  ['panda roux', '🐼'],
  ["cochon d'inde", '🐹'],
  ['lapin', '🐰'],
  ['ours', '🐻'],
  ['souris', '🐭'],
  ['taupe', '🐾'],
  ['tanuki', '🦝'],
  ['raton', '🦝'],
  ['renard', '🦊'],
  ['ecureuil', '🐿️'],
  ['tamia', '🐿️'],
  ['chat', '🐱'],
  ['chien', '🐶'],
  ['herisson', '🦔'],
  ['koala', '🐨'],
  ['kangourou', '🦘'],
  ['panda', '🐼'],
  ['pingouin', '🐧'],
  ['manchot', '🐧'],
  ['castor', '🦫'],
  ['loutre', '🦦'],
  ['mouton', '🐑'],
  ['chevre', '🐐'],
  ['cochon', '🐷'],
  ['renne', '🦌'],
  ['cerf', '🦌'],
  ['elephant', '🐘'],
  ['hamster', '🐹'],
  ['poney', '🐴'],
  ['cheval', '🐴'],
  ['loup', '🐺'],
  ['hibou', '🦉'],
  ['chouette', '🦉'],
  ['canard', '🦆'],
  ['singe', '🐵'],
  ['lion', '🦁'],
  ['tigre', '🐯'],
  ['vache', '🐮'],
  ['phoque', '🦭'],
  ['rabbit', '🐰'],
  ['bear', '🐻'],
  ['mouse', '🐭'],
  ['cat', '🐱'],
  ['dog', '🐶'],
];

export function speciesEmoji(species: string | undefined): string {
  const s = normalize(species ?? '');
  return EMOJI.find(([key]) => s.includes(key))?.[1] ?? '🐾';
}

/** Teinte stable (0-359) dérivée de l'espèce, pour colorer les vignettes sans photo. */
export function speciesHue(species: string | undefined): number {
  let h = 0;
  for (const c of normalize(species ?? '')) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
