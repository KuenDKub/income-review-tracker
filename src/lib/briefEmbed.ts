/**
 * Helpers for previewing brief links (Canva / Google Docs / Drive) inline.
 * Shared by the brief card embed and the brief attachment tiles.
 */

/**
 * If `link` points at a provider we can embed, return an iframe-able URL so the
 * brief renders inline. Handles public Canva design links (`.../view?embed`)
 * and Google Docs/Slides/Sheets (`/edit` → `/preview`) plus Google Drive files.
 * Returns null otherwise (we just show an "open" button). Private docs show the
 * provider's own permission wall inside the iframe.
 */
export function briefLinkEmbed(link: string): string | null {
  try {
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    // Canva public design view link
    if (
      (host === "canva.com" || host.endsWith(".canva.com")) &&
      u.pathname.includes("/design/")
    ) {
      return `${u.origin}${u.pathname}?embed`;
    }
    // Google Docs / Slides / Sheets — swap the trailing action for /preview
    if (host === "docs.google.com") {
      const m = u.pathname.match(
        /^\/(document|presentation|spreadsheets)\/d\/([^/]+)/,
      );
      if (m) return `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
    }
    // Google Drive shared file (PDF, image, doc) — `/file/d/<id>/preview`
    if (host === "drive.google.com") {
      const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    return null;
  } catch {
    return null;
  }
}

/** True when the string parses as an http(s) URL. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Short, human-readable label for a link (its host without `www.`). */
export function linkHostLabel(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}
