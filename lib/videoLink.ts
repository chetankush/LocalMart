/**
 * A product's video: the shop's own Instagram reel or post of the item.
 * Sellers paste whatever Instagram's "Copy link" gives them
 * (…/reel/AbC123/?igsh=…, with a username in front, instagr.am…); we only
 * ever use the clean address. Same rules as the API's
 * src/shared/helpers/video-link.ts.
 */

const INSTAGRAM_LINK =
  /(?:https?:\/\/)?(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(?:[A-Za-z0-9._]{1,30}\/)?(reels?|p|tv)\/([A-Za-z0-9_-]{5,40})/i;

export type VideoLink = {
  /** "instagram": a reel shown in Instagram's player. "file": a video file played right in the page. */
  kind: "instagram" | "file";
  /** The clean address: the reel (opens in Instagram), or the video file itself */
  url: string;
  /** Instagram's own player for it, to show inside our page (null for a video file) */
  embedUrl: string | null;
};

const VIDEO_FILE = /\.(?:mp4|webm|m4v|mov)$/i;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** A direct link to a video file. Same rules as the API's directVideoLink. */
function parseFileLink(input: string): string | null {
  if (!input || /\s/.test(input)) return null;
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return null;
  }
  const local = LOCAL_HOSTS.has(u.hostname);
  if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) return null;
  if (u.username || u.password) return null;
  if (!VIDEO_FILE.test(u.pathname)) return null;
  u.hash = "";
  return u.toString();
}

/** The reel, post or video file in what the seller pasted, or null when there isn't one */
export function parseVideoLink(input: string | null | undefined): VideoLink | null {
  const text = (input ?? "").trim();
  const m = text.match(INSTAGRAM_LINK);
  if (m) {
    const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
    const url = `https://www.instagram.com/${kind}/${m[2]}/`;
    return { kind: "instagram", url, embedUrl: `${url}embed/` };
  }
  const file = parseFileLink(text);
  return file ? { kind: "file", url: file, embedUrl: null } : null;
}

export const VIDEO_LINK_PROBLEM =
  "That isn’t a video link. Paste an Instagram reel link (open the reel → Share → Copy link) or a direct link to a video file ending in .mp4.";
