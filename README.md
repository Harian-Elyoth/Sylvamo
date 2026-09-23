# Sylvamo

Application mobile (iOS / Android) pour répertorier ta collection de **Sylvanian Families** :
un catalogue des figurines, une case « je l'ai » et un cœur « souhait » sur chaque figurine,
une photo perso, l'état, le prix payé et des notes.

Tout est enregistré **localement sur le téléphone**. Pense à exporter une sauvegarde de temps en temps
(Réglages → Exporter).

## Lancer l'app

```bash
npm install
npx expo start
```

Scanne ensuite le QR code avec l'app **Expo Go** (App Store / Play Store) sur ton téléphone.
`npx expo start --web` ouvre l'app dans le navigateur.

## Écrans

| Onglet | Contenu |
| --- | --- |
| Catalogue | Recherche (nom, espèce, n° de référence), filtres par statut et par collection, liste groupée par set. Le **+** ajoute une figurine qui manque au catalogue. |
| Ma collection | Les figurines cochées, groupées par collection, avec la progression. |
| Souhaits | La liste de souhaits. Cocher une figurine « je l'ai » la retire de cette liste. |
| Réglages | Statistiques, export / import d'une sauvegarde JSON, effacement de toutes les données. |

La fiche d'une figurine contient sa photo (appareil photo ou galerie), son état, le prix payé,
la date d'achat et des notes. La fiche d'un set permet de tout cocher d'un coup.

## Le catalogue

Le catalogue embarqué dans l'app est `assets/catalog.json`. Il est généré par `scripts/build-catalog.mjs` :

```bash
npm run build:catalog        # à partir de data/seed.json uniquement
npm run build:catalog:wiki   # + les pages du Sylvanian Families Wiki (Fandom, CC BY-SA)
node scripts/build-catalog.mjs --wiki --category="Baby Collection:babies"   # une autre catégorie du wiki
```

- `data/seed.json` est le catalogue de départ, saisi à la main : les familles principales, chacune avec
  4 figurines génériques (Père, Mère, Frère, Sœur). Pour corriger une famille ou en ajouter une,
  modifie ce fichier puis relance `npm run build:catalog`.
- L'option `--wiki` lit les catégories du wiki avec l'API MediaWiki. Pour chaque page, elle récupère le
  n° de référence, l'année, l'espèce et les membres listés.
- Les identifiants des figurines sont dérivés des noms (`chocolate-rabbit-family--pere`). Ta collection
  est enregistrée sous ces identifiants : un set déjà présent n'est donc jamais remplacé par le wiki,
  seulement enrichi (référence, année).
- Aucune image officielle n'est incluse. Les photos sont les tiennes.

## Développement

```bash
npm run typecheck
npm run lint
npm test              # tests Jest (filtres, store, sauvegarde, catalogue) + tests du script du catalogue
```

Structure :

- `src/app/` : écrans (Expo Router)
- `src/components/` : composants d'interface
- `src/data/catalog.ts` : chargement du catalogue et fusion avec les figurines ajoutées à la main
- `src/store/collection.ts` : état de la collection (zustand + AsyncStorage), sauvegarde et restauration
- `src/lib/` : filtres et recherche, photos, export / import

---

Application de fan, sans lien avec Epoch Co., Ltd. *Sylvanian Families* et *Calico Critters* sont des
marques de leurs propriétaires respectifs.
