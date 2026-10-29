/**
 * Runs once when the website's server starts.
 *
 * The server builds pages for every shopper, so all its calls to the API come
 * from one address. Without this, the API's per-address rate limit would be
 * shared by all shoppers together. Here every server-side call to the API
 * carries INTERNAL_API_KEY (a secret, never sent to browsers), and the API
 * doesn't count those calls against the limit.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const key = process.env.INTERNAL_API_KEY;
  const api = process.env.NEXT_PUBLIC_API_URL;
  if (!key || !api) return;

  let apiOrigin: string;
  try {
    apiOrigin = new URL(api).origin;
  } catch {
    return;
  }

  const baseFetch = globalThis.fetch;
  const withKey: typeof fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(apiOrigin)) return baseFetch(input, init);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set("x-localmart-internal", key);
    return baseFetch(input, { ...init, headers });
  };
  globalThis.fetch = withKey;
}
