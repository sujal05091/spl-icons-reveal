# SPL Season 2 — Captain Reveal

A React + Vite website for revealing 12 captain/player identities and assigning one captain to each sponsor.

## Requirements
- Node.js 18+ (Node 20 LTS recommended)
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite, usually `http://localhost:5173`.

## Organizer setup
1. Click **Organizer**.
2. The starter PIN is `2026`. Change it before using the demo.
3. Upload all 12 captain photos and enter their names.
4. Optionally enter sponsor names in advance.
5. Click **Save Setup**.
6. Click **Organizer → Prepare Draw** and confirm.
7. Return to the board. Enter a sponsor name and click an available card.
8. Confirm the reveal. The captain identity is shown and the card is assigned.
9. Use **Final Team Board** to review results and export CSV.

## Image tips
- Use JPG or PNG.
- Keep each image under 1.2 MB for browser storage.
- Use clear portrait photos. The app crops photos to fit cards, while the reveal dialog uses a circular portrait.
- Captain photos are stored as browser-local data in this starter version.

## Build for deployment
```bash
npm run build
npm run preview
```
Deploy the project to Vercel by importing the project folder/repository and using the default Vite build settings.

## Important security limitation
This is a functional **single-browser starter/demo**. It stores its configuration and assignments in that browser's `localStorage`, and its random mapping is held in client-side app state. A technically savvy user could inspect browser data or source code. Do not use it where unrevealed captain identities must be cryptographically private from attendees. For a real public event with strict secrecy or multiple devices, add an authenticated backend (e.g. Supabase) with server-side mapping, atomic one-time reveal transactions, row-level security, and protected organizer routes.

The organizer PIN in this starter is a convenience gate, not secure authentication. Change the PIN and keep the organizer panel off the projector during setup.

## Included features
- 12 mystery cards
- Captain image and name setup
- Random one-to-one mapping
- Reveal confirmation
- Card locking and duplicate assignment prevention
- Smooth animations
- Optional reveal tone
- Assignment progress
- Final results board
- CSV export and print layout
- Browser-local persistence
- Reset confirmation
