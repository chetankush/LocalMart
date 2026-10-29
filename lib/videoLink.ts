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
  /** https://www.instagram.com/reel/AbC123/ — opens it in Instagram */
  url: string;
  /** Instagram's own player for it, to show inside our page */
  embedUrl: string;
};

/** The reel or post in what the seller pasted, or null when there isn't one */
export function parseVideoLink(input: string | null | undefined): VideoLink | null {
  const m = (input ?? "").trim().match(INSTAGRAM_LINK);
  if (!m) return null;
  const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
  const url = `https://www.instagram.com/${kind}/${m[2]}/`;
  return { url, embedUrl: `${url}embed/` };
}

export const VIDEO_LINK_PROBLEM = "That isn’t an Instagram reel link. On Instagram: open the reel → Share → Copy link.";
