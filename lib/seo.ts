/**
 * Public site address for canonical links and Google structured data.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://localmart.in).
 */
export function siteUrl(path = ""): string | undefined {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return base ? `${base}${path}` : undefined;
}

/** JSON for a <script type="application/ld+json">, safe inside HTML */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
