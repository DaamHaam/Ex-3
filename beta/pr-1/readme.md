# Belgique vs France – Scoreboard temps réel

Application web React construite avec Vite et installable comme PWA. Elle permet de suivre le duel "Belgique vs France" entre les enfants Eliott, Timéo et Lilouan avec synchronisation en temps réel via Supabase Realtime.

## Fonctionnalités

- Score initial fixé à 4 points pour chacun des enfants.
- Bouton tactile +1 et bouton pour retirer 1 point par enfant avec commentaire facultatif.
- Historique complet des ajouts/retraits de points.
- Annulation du dernier point enregistré.
- Interface responsive en français, adaptée aux écrans mobiles.
- PWA avec manifest et service worker pour installation et usage hors-ligne (mode lecture).
- Synchronisation temps réel grâce à Supabase JS v2 et Realtime.

## Configuration

1. Duplique le fichier `.env.example` en `.env.local` puis adapte les valeurs si besoin :

```bash
cp .env.example .env.local
```

2. Vérifie que ta base Supabase contient la table suivante :

```sql
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  player text not null,
  delta integer not null,
  comment text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Optimise l'affichage par ordre chronologique
create index if not exists events_created_at_idx on public.events (created_at desc);
```

Aucune règle RLS n'est nécessaire pour ce MVP (laisser RLS désactivée).

## Développement

```bash
npm install
npm run dev -- --host
```

Ouvre ensuite [http://localhost:5173](http://localhost:5173) sur chaque appareil.

### Production

```bash
npm run build
npm run preview
```

Le service worker (`public/sw.js`) met en cache l'application pour une consultation hors-ligne minimale.

## Structure

- `src/App.jsx` : logique principale (scores, historique, modale de commentaire).
- `src/lib/supabaseClient.js` : configuration Supabase.
- `public/manifest.webmanifest` & `public/sw.js` : configuration PWA.

## Crédit

Design improvisé pour une expérience tactile simple et colorée.
