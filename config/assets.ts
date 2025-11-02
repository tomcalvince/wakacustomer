// Centralized asset paths for the app
// Rule: Place static images in the Next.js `public/` folder so they are served at the root.
// Example: public/assets/gummy-bag.svg -> "/assets/gummy-bag.svg"

export const ASSET_BASE = "/assets"

export const ASSETS = {
  gummyBag: `${ASSET_BASE}/gummy-wallet.svg`,
  // Add more assets here as you save them into public/assets
}

export function assetPath(relative: string) {
  // Ensures leading slash and prefixes with base when needed
  const rel = relative.startsWith("/") ? relative : `/${relative}`
  return rel.startsWith(ASSET_BASE) ? rel : `${ASSET_BASE}${rel}`
}


