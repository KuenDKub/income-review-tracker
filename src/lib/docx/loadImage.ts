/**
 * Best-effort image loader for embedding into generated .docx files.
 *
 * Accepts either an absolute http(s) URL (remote storage) or a site-relative
 * path like `/uploads/foo.png` (local dev filesystem). Returns the raw bytes
 * plus a docx-compatible image type, or `null` if the image can't be loaded or
 * is an unsupported format (e.g. WebP, which Word renders unreliably). Callers
 * should treat `null` as "no image" and fall back gracefully — this never throws.
 */
import { readFile } from "fs/promises";
import { join } from "path";

type DocxImageType = "png" | "jpg" | "gif" | "bmp";

/** Detect format from magic bytes — robust regardless of file extension. */
function detectType(buf: Buffer): DocxImageType | null {
  if (buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "gif";
  if (buf[0] === 0x42 && buf[1] === 0x4d) return "bmp";
  return null; // WebP / SVG / unknown — skip
}

export type LoadedImage = { data: Buffer; type: DocxImageType };

export async function loadImageForDocx(
  url: string | null | undefined,
  origin?: string,
): Promise<LoadedImage | null> {
  if (!url) return null;
  try {
    let buf: Buffer;
    if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
    } else if (url.startsWith("/")) {
      // First try the absolute URL via origin (works behind storage proxies);
      // fall back to reading from the local public/ directory (dev uploads).
      if (origin) {
        try {
          const res = await fetch(`${origin}${url}`);
          if (res.ok) {
            const b = Buffer.from(await res.arrayBuffer());
            const t = detectType(b);
            if (t) return { data: b, type: t };
          }
        } catch {
          /* fall through to filesystem */
        }
      }
      buf = await readFile(join(process.cwd(), "public", url));
    } else {
      return null;
    }
    const type = detectType(buf);
    return type ? { data: buf, type } : null;
  } catch {
    return null;
  }
}
