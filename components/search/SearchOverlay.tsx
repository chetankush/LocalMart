"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpLeft, ChevronLeft, Clock, Loader2, Mic, Search, Store, TrendingUp, X } from "lucide-react";
import { apiClient, type SearchResponse } from "@/lib/api/client";
import { useLocation } from "@/context/LocationContext";
import { useVoiceSearch, VOICE_ERROR_TEXT, type VoiceLang } from "@/hooks/useVoiceSearch";
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "@/lib/search/recent";
import { rupees } from "@/components/app/ui";

// One-tap ideas for first-time shoppers (Hindi + English)
const STARTERS = [
  { label: "साड़ी · Saree", q: "saree" },
  { label: "दूध · Milk", q: "milk" },
  { label: "आटा · Atta", q: "atta" },
  { label: "दवाई · Medicine", q: "medicine" },
  { label: "सब्ज़ी · Vegetables", q: "vegetables" },
  { label: "मोबाइल · Mobile", q: "mobile" },
];

/** Bold the parts of a result that match what was searched */
function Highlight({ text, words }: { text: string; words: string[] }) {
  const usable = words.filter((w) => w.length >= 2);
  if (usable.length === 0) return <>{text}</>;
  const re = new RegExp(`(${usable.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        usable.some((w) => w.toLowerCase() === part.toLowerCase()) ? (
          <strong key={i} className="font-semibold text-label">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function SearchOverlay({
  open,
  onClose,
  startWithVoice = false,
}: {
  open: boolean;
  onClose: () => void;
  startWithVoice?: boolean;
}) {
  const router = useRouter();
  const { location } = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const requestId = useRef(0);

  const go = useCallback(
    (href: string, remember?: string) => {
      if (remember) addRecentSearch(remember);
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const submit = useCallback(
    (q: string) => {
      const text = q.trim();
      if (!text) return;
      go(`/search?q=${encodeURIComponent(text)}`, text);
    },
    [go],
  );

  const voice = useVoiceSearch((text) => {
    setQuery(text);
    // Give the shopper a moment to see what was heard, then search
    setTimeout(() => submit(text), 600);
  });

  // Open / close housekeeping
  useEffect(() => {
    if (!open) {
      voice.cancel();
      return;
    }
    setRecent(getRecentSearches());
    apiClient.popularSearches(8).then(setPopular);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      if (startWithVoice && voice.supported) voice.start();
      else inputRef.current?.focus();
    }, 50);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Live results while typing (debounced, latest request wins)
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) {
      setResults(null);
      setLoading(false);
      setFailed(false);
      return;
    }
    const id = ++requestId.current;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await apiClient.searchShop(q, {
          limit: 6,
          pincode: location?.pincode,
          lat: location?.latitude,
          lng: location?.longitude,
          signal: controller.signal,
        });
        if (id === requestId.current) {
          setResults(r);
          setFailed(false);
        }
      } catch (err) {
        if (id === requestId.current && (err as Error).name !== "AbortError") setFailed(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query, open, location?.pincode, location?.latitude, location?.longitude]);

  if (!open) return null;

  const q = query.trim();
  const words = (results?.interpreted ?? q).split(/\s+/).concat(q.split(/\s+/));
  const hasResults = !!results && (results.products.length > 0 || results.stores.length > 0);
  const area = location?.pincode;

  return (
    <div className="fixed inset-0 z-[80] lg:flex lg:justify-center lg:bg-black/40 lg:pt-3" role="dialog" aria-modal="true" aria-label="Search">
      <div className="flex h-full w-full flex-col bg-card lg:h-auto lg:max-h-[85vh] lg:max-w-3xl lg:overflow-hidden lg:rounded-2xl lg:shadow-2xl">
        {/* Search bar */}
        <div className="flex items-center gap-2 bg-navy px-2 pb-2.5 pt-[calc(10px+env(safe-area-inset-top,0px))] lg:pt-2.5">
          <button
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white active:bg-navy-2 cursor-pointer"
            aria-label="Close search"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
          </button>
          <form
            className="relative flex-1"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-label-2" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={voice.listening ? "Listening…" : "Search saree, atta, medicine…"}
              aria-label="Search shops and products"
              autoComplete="off"
              className="h-11 w-full rounded-lg bg-white pl-10 pr-20 text-[16px] text-label placeholder:text-label-3 outline-none focus:ring-2 focus:ring-saffron"
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin text-label-3" aria-hidden />}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-label-2 hover:bg-fill cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {voice.supported && (
                <button
                  type="button"
                  onClick={() => (voice.listening ? voice.stop() : voice.start())}
                  className={`flex h-9 w-9 items-center justify-center rounded-full cursor-pointer ${
                    voice.listening ? "bg-deal text-white" : "text-label hover:bg-fill"
                  }`}
                  aria-label={voice.listening ? "Stop listening" : "Search by voice"}
                >
                  <Mic className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
          {/* Voice */}
          {(voice.listening || voice.error) && (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <button
                onClick={() => (voice.listening ? voice.stop() : voice.start())}
                className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-cta text-white cursor-pointer"
                aria-label={voice.listening ? "Stop listening" : "Try again"}
              >
                {voice.listening && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-cta/30 motion-reduce:animate-none" aria-hidden />
                )}
                <Mic className="relative h-10 w-10" />
              </button>
              {voice.listening ? (
                <>
                  <p className="text-[22px] font-bold text-label">{voice.interim || "Listening…"}</p>
                  <p className="mt-1 text-[16px] text-label-2">
                    {voice.lang === "hi-IN" ? "बोलिए — जैसे “लाल साड़ी” या “दूध”" : "Speak now — e.g. “red saree” or “milk”"}
                  </p>
                </>
              ) : (
                <>
                  <p className="max-w-sm text-[17px] font-semibold text-label">{voice.error && VOICE_ERROR_TEXT[voice.error]}</p>
                  <button
                    onClick={() => voice.start()}
                    className="mt-4 h-11 rounded-full bg-cta px-6 text-[15px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
                  >
                    Try again
                  </button>
                </>
              )}
              <div className="mt-6 inline-flex rounded-full bg-fill p-1" role="group" aria-label="Voice language">
                {(["hi-IN", "en-IN"] as VoiceLang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      voice.setLang(l);
                      if (voice.listening) voice.start(l);
                    }}
                    aria-pressed={voice.lang === l}
                    className={`h-9 rounded-full px-4 text-[15px] font-medium cursor-pointer ${
                      voice.lang === l ? "bg-card text-label shadow-sm" : "text-label-2"
                    }`}
                  >
                    {l === "hi-IN" ? "हिंदी" : "English"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Before typing */}
          {!voice.listening && !voice.error && q.length < 2 && (
            <div className="px-4 py-4">
              {recent.length > 0 && (
                <section className="mb-6">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-[17px] font-bold text-label">Recent searches</h2>
                    <button
                      onClick={() => {
                        clearRecentSearches();
                        setRecent([]);
                      }}
                      className="text-[15px] text-link hover:text-link-hover cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <ul>
                    {recent.map((r) => (
                      <li key={r} className="flex items-center">
                        <button
                          onClick={() => submit(r)}
                          className="flex min-h-[48px] flex-1 items-center gap-3 text-left text-[16px] text-label cursor-pointer"
                        >
                          <Clock className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
                          {r}
                        </button>
                        <button
                          onClick={() => {
                            setQuery(r);
                            inputRef.current?.focus();
                          }}
                          className="flex h-11 w-11 items-center justify-center text-label-3 cursor-pointer"
                          aria-label={`Edit “${r}”`}
                        >
                          <ArrowUpLeft className="h-5 w-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {popular.length > 0 && (
                <section className="mb-6">
                  <h2 className="mb-3 flex items-center gap-2 text-[17px] font-bold text-label">
                    <TrendingUp className="h-5 w-5 text-deal" aria-hidden /> Popular near you
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {popular.map((p) => (
                      <button
                        key={p}
                        onClick={() => submit(p)}
                        className="h-10 rounded-full border border-hairline bg-card px-4 text-[15px] text-label hover:bg-fill cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="mb-3 text-[17px] font-bold text-label">Try searching</h2>
                <div className="grid grid-cols-2 gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s.q}
                      onClick={() => submit(s.q)}
                      className="flex h-12 items-center rounded-xl bg-fill px-3 text-left text-[15px] font-medium text-label hover:bg-fill-strong cursor-pointer"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {voice.supported && (
                  <button
                    onClick={() => voice.start()}
                    className="mt-4 flex w-full items-center gap-3 rounded-xl border border-hairline p-3 text-left cursor-pointer hover:bg-fill"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint-soft text-tint">
                      <Mic className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[16px] font-semibold text-label">Search by voice</span>
                      <span className="block text-[14px] text-label-2">बोलकर खोजें — Hindi or English</span>
                    </span>
                  </button>
                )}
              </section>
            </div>
          )}

          {/* While typing */}
          {!voice.listening && !voice.error && q.length >= 2 && (
            <div className="pb-6">
              <button
                onClick={() => submit(q)}
                className="flex min-h-[52px] w-full items-center gap-3 border-b border-hairline px-4 text-left text-[16px] cursor-pointer hover:bg-fill"
              >
                <Search className="h-5 w-5 shrink-0 text-label-2" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  Search for <strong className="font-semibold">“{q}”</strong>
                  {results?.interpreted && <span className="text-label-2"> · showing {results.interpreted}</span>}
                </span>
              </button>

              {failed && (
                <p className="px-4 py-6 text-center text-[15px] text-label-2">Couldn&apos;t search right now. Check your internet.</p>
              )}

              {results && results.products.length > 0 && (
                <section className="pt-2">
                  <h2 className="px-4 pb-1 pt-2 text-[13px] font-bold uppercase tracking-wide text-label-2">Products</h2>
                  <ul>
                    {results.products.map((p) => {
                      const out = p.stockQuantity <= 0;
                      return (
                        <li key={p.id}>
                          <button
                            onClick={() => go(`/products/${p.id}`, q)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-fill cursor-pointer"
                          >
                            <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-hairline bg-fill">
                              {p.images[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-[15px] leading-snug text-label-2">
                                <Highlight text={p.name} words={words} />
                              </span>
                              <span className="mt-0.5 flex items-baseline gap-2">
                                <span className="text-[16px] font-bold text-label">{rupees(p.price)}</span>
                                {p.compareAtPrice && p.compareAtPrice > p.price && (
                                  <span className="text-[13px] text-label-2 line-through">{rupees(p.compareAtPrice)}</span>
                                )}
                                <span className="truncate text-[13px] text-label-2">· {p.vendorName}</span>
                              </span>
                              {out && <span className="text-[13px] font-medium text-bad">Out of stock</span>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {results && results.stores.length > 0 && (
                <section className="pt-2">
                  <h2 className="px-4 pb-1 pt-2 text-[13px] font-bold uppercase tracking-wide text-label-2">Shops</h2>
                  <ul>
                    {results.stores.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => go(`/stores/${s.id}`, q)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-fill cursor-pointer"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-fill">
                            {s.storeLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.storeLogo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-5 w-5 text-label" aria-hidden />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[16px] font-semibold text-label">
                              <Highlight text={s.businessName} words={words} />
                            </span>
                            <span className="block truncate text-[14px] text-label-2">{s.locality || s.city}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {hasResults && (results!.totalProducts > results!.products.length || results!.totalStores > results!.stores.length) && (
                <button
                  onClick={() => submit(q)}
                  className="mx-4 mt-3 block w-[calc(100%-2rem)] rounded-full border border-hairline py-3 text-center text-[15px] font-semibold text-link hover:bg-fill cursor-pointer"
                >
                  See all {results!.totalProducts + results!.totalStores} results
                </button>
              )}

              {results && !hasResults && !loading && (
                <div className="px-6 py-10 text-center">
                  <p className="text-[18px] font-bold text-label">No results for “{q}”</p>
                  <p className="mt-1 text-[15px] text-label-2">
                    {results.outsideArea && results.outsideArea.products + results.outsideArea.stores > 0
                      ? `Found ${results.outsideArea.products + results.outsideArea.stores} in other areas, but none deliver to ${area}.`
                      : "Check the spelling, try another word, or search by voice."}
                  </p>
                  {results.outsideArea && results.outsideArea.products + results.outsideArea.stores > 0 && (
                    <button
                      type="button"
                      onClick={() => submit(q)}
                      className="mt-4 h-11 rounded-full bg-label px-5 text-[15px] font-semibold text-white cursor-pointer"
                    >
                      Show them
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
