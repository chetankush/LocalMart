"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Link2, Printer } from "lucide-react";
import { Button, LargeTitle, Notice, Page } from "@/components/app/ui";
import { SectionHeader } from "@/components/app/seller";
import { Segmented } from "@/components/app/form";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { apiError } from "@/components/ads/adLabels";
import { siteHost } from "@/app/vendor/settings/ShopLinkCard";

type Shop = { id: string; businessName: string; storeLogo: string | null };
type Format = "story" | "square";
type Card = { blob: Blob; url: string } | "error";

// The poster is printed/downloaded, so it uses the brand colours directly
const CRIMSON = "#D61F45";
const INK = "#111111";
const GREY = "#4B5058";
const HAIRLINE = "#E6E6E8";
const CTA = "Scan to see our shop & order from home";
const CTA_HI = "स्कैन करें — दुकान देखें, घर बैठे ऑर्डर करें";
const PRINT_ID = "lm-print-poster";

// Only the poster prints: everything else on the page is hidden on paper
const PRINT_CSS = `
#${PRINT_ID} { display: none; }
@media print {
  @page { size: portrait; margin: 10mm; }
  html, body { background: #fff !important; height: auto !important; }
  body > *:not(#${PRINT_ID}) { display: none !important; }
  #${PRINT_ID} { display: block !important; width: min(100%, 70vh); margin: 0 auto; break-inside: avoid; }
  #${PRINT_ID} * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/** Bigger letters for short shop names, smaller for long ones (in % of poster width) */
const nameSize = (name: string) => (name.length > 26 ? 6 : name.length > 16 ? 7 : 8);
const linkSize = (link: string) => Math.min(5.6, 140 / Math.max(link.length, 1));

/**
 * The counter poster: logo, shop name, big QR of the short link, the link
 * itself and "scan to order". Sizes are in cqw (% of the poster's width), so
 * the same poster fits the phone preview, A4 and A5 paper.
 */
function Poster({ name, logo, link, qr }: { name: string; logo: string | null; link: string; qr: string }) {
  return (
    <div style={{ containerType: "inline-size", width: "100%", aspectRatio: "1 / 1.4142", position: "relative", background: "#FFFFFF" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          color: INK,
          border: `1cqw solid ${CRIMSON}`,
          borderRadius: "4cqw",
          padding: "5.5cqw 6cqw 4cqw",
          overflow: "hidden",
        }}
      >
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            style={{ width: "14cqw", height: "14cqw", borderRadius: "50%", objectFit: "cover", marginBottom: "2.5cqw", flexShrink: 0 }}
          />
        )}
        <p
          style={{
            fontSize: `${nameSize(name)}cqw`,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {name}
        </p>
        <p style={{ marginTop: "3.5cqw", fontSize: "4.8cqw", fontWeight: 700, lineHeight: 1.2, color: CRIMSON }}>{CTA}</p>
        <p style={{ marginTop: "1.2cqw", fontSize: "3.8cqw", lineHeight: 1.4, color: GREY }}>{CTA_HI}</p>
        <div style={{ marginTop: "3.5cqw", padding: "2cqw", border: `0.4cqw solid ${HAIRLINE}`, borderRadius: "3cqw", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt={`QR code for ${link}`}
            style={{ display: "block", width: "46cqw", height: "46cqw" }}
          />
        </div>
        <p style={{ marginTop: "3cqw", fontSize: `${linkSize(link)}cqw`, fontWeight: 800, lineHeight: 1.2, overflowWrap: "anywhere" }}>
          {link}
        </p>
        <p style={{ marginTop: "auto", fontSize: "3cqw", fontWeight: 800, color: CRIMSON }}>LocalMart</p>
      </div>
    </div>
  );
}

/* ─── Poster as a PNG (same look, drawn on a canvas) ────────────── */

function loadImage(src: string, cors: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // The logo comes from photo storage; without this the canvas can't be saved
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Breaks text into lines that fit; the last allowed line is cut with … */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (!line || ctx.measureText(next).width <= width) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= max) return lines;
  let last = lines[max - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
  return [...lines.slice(0, max - 1), `${last.trimEnd()}…`];
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.stroke();
}

/** A4 at 150 dpi: sharp enough to print at a photo shop */
async function drawPoster({ name, logo, link, fullLink }: { name: string; logo: string | null; link: string; fullLink: string }) {
  const W = 1240;
  const H = 1754;
  const u = W / 100; // 1% of the width, like cqw on the page
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const font = (weight: number, size: number) => `${weight} ${size}px ${family}`;
  const logoImg = logo ? await loadImage(logo, true) : null;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  const inset = 3 * u;
  ctx.strokeStyle = CRIMSON;
  ctx.lineWidth = u;
  roundRect(ctx, inset, inset, W - 2 * inset, H - 2 * inset, 4 * u);

  const cx = W / 2;
  const maxW = W - 2 * inset - 12 * u;
  let y = inset + 6.5 * u;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (logoImg) {
    const s = 14 * u;
    const r = Math.max(s / logoImg.naturalWidth, s / logoImg.naturalHeight);
    const w = logoImg.naturalWidth * r;
    const h = logoImg.naturalHeight * r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, y + s / 2, s / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, cx - w / 2, y + (s - h) / 2, w, h);
    ctx.restore();
    y += s + 2.5 * u;
  }

  const text = (t: string, weight: number, size: number, color: string, maxLines: number, lineHeight: number) => {
    ctx.font = font(weight, size);
    ctx.fillStyle = color;
    for (const line of wrapLines(ctx, t, maxW, maxLines)) {
      ctx.fillText(line, cx, y);
      y += size * lineHeight;
    }
  };
  text(name, 800, nameSize(name) * u, INK, 2, 1.1);
  y += 3.5 * u;
  text(CTA, 700, 4.8 * u, CRIMSON, 2, 1.2);
  y += 1.2 * u;
  text(CTA_HI, 400, 3.8 * u, GREY, 2, 1.4);
  y += 3.5 * u;

  // Link size: shrink until it fits on one line
  let ls = linkSize(link) * u;
  ctx.font = font(800, ls);
  while (ls > 2 * u && ctx.measureText(link).width > maxW) ctx.font = font(800, (ls -= 0.2 * u));
  const brandY = H - inset - 7 * u;

  // QR gets whatever room is left, up to about half the width
  const box = Math.min(52 * u, brandY - 3 * u - ls * 1.2 - 3 * u - y);
  const pad = 2 * u;
  ctx.strokeStyle = HAIRLINE;
  ctx.lineWidth = 0.4 * u;
  roundRect(ctx, cx - box / 2, y, box, box, 3 * u);
  // @ts-expect-error - qrcode has no bundled type declarations
  const QRCode = (await import("qrcode")).default;
  const qr = await loadImage(
    await QRCode.toDataURL(fullLink, { width: Math.round(box - 2 * pad), margin: 1, color: { dark: INK, light: "#FFFFFF" } }),
    false,
  );
  if (!qr) return null;
  ctx.drawImage(qr, cx - box / 2 + pad, y + pad, box - 2 * pad, box - 2 * pad);
  y += box + 3 * u;

  ctx.font = font(800, ls);
  ctx.fillStyle = INK;
  ctx.fillText(link, cx, y);
  ctx.font = font(800, 3 * u);
  ctx.fillStyle = CRIMSON;
  ctx.fillText("LocalMart", cx, brandY);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Saves a file to the phone/computer */
function saveFile(href: string, fileName: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Posters & share images: a QR poster to print for the shop counter, and a
 * "New arrivals" picture of the newest stock for WhatsApp status / Instagram.
 */
export default function ShareKitPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  // undefined while loading; null when the shop has no short link yet
  const [handle, setHandle] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [savingPoster, setSavingPoster] = useState(false);
  const [format, setFormat] = useState<Format>("story");
  const [cards, setCards] = useState<Partial<Record<Format, Card>>>({});
  const [retry, setRetry] = useState(0);
  const started = useRef(new Set<Format>());
  const blobUrls = useRef<string[]>([]);

  useEffect(() => {
    (async () => {
      const storeId = new URLSearchParams(window.location.search).get("storeId");
      const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
      try {
        const { apiClient } = await import("@/lib/api/client");
        const s = await apiClient.get<{ data: Shop }>(`/vendor/settings${q}`);
        // Ask with the same shop's id, so both answers are about one shop
        const link = await apiClient.get<{ data: { handle: string | null; suggestion: string | null } }>(
          `/vendor/shop-link?storeId=${encodeURIComponent(s.data.id)}`,
        );
        setShop({ id: s.data.id, businessName: s.data.businessName, storeLogo: s.data.storeLogo || null });
        setHandle(link.data?.handle ?? null);
      } catch (err) {
        if (apiError(err).isAuth) {
          router.push("/sign-in?redirect=%2Fvendor%2Fshare-kit");
          return;
        }
        if ((err as { status?: number })?.status === 403) {
          setError("This page is for shop owners.");
          return;
        }
        setError(apiError(err).message || "Couldn't load your shop. Please try again.");
      }
    })();
  }, [router]);

  const link = handle ? `${siteHost()}/${handle}` : null;
  const fullLink = link ? `https://${link}` : null;
  // Without a short link, the share picture and message use the long one
  const shareLink = fullLink ?? (shop ? `https://${siteHost()}/stores/${shop.id}` : "");

  // QR for the poster as an SVG, so it stays sharp at any paper size
  useEffect(() => {
    if (!fullLink) return;
    let alive = true;
    (async () => {
      // @ts-expect-error - qrcode has no bundled type declarations
      const QRCode = (await import("qrcode")).default;
      const svg: string = await QRCode.toString(fullLink, { type: "svg", margin: 1, color: { dark: INK, light: "#FFFFFF" } });
      if (alive) setQr(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    })().catch(() => toast.error("Couldn't make the QR code. Please reload the page."));
    return () => {
      alive = false;
    };
  }, [fullLink]);

  // The share picture is fetched once per format and kept, so Download and
  // Share work straight away (phones only allow sharing right after a tap)
  useEffect(() => {
    if (!shop || started.current.has(format)) return;
    started.current.add(format);
    fetch(`/api/share-card/${shop.id}?format=${format}`)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        blobUrls.current.push(url);
        setCards((c) => ({ ...c, [format]: { blob, url } }));
      })
      .catch(() => {
        started.current.delete(format);
        setCards((c) => ({ ...c, [format]: "error" }));
      });
  }, [shop, format, retry]);

  useEffect(() => {
    const urls = blobUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const downloadPoster = async () => {
    if (!shop || !link || !fullLink) return;
    setSavingPoster(true);
    try {
      const blob = await drawPoster({ name: shop.businessName, logo: shop.storeLogo, link, fullLink });
      if (!blob) throw new Error("no image");
      const url = URL.createObjectURL(blob);
      saveFile(url, `${handle}-qr-poster.png`);
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.error("Couldn't make the image. Try Print instead.");
    } finally {
      setSavingPoster(false);
    }
  };

  const card = cards[format];
  const ready = card && card !== "error" ? card : null;
  const cardFile = `${handle || "shop"}-new-arrivals-${format}.png`;

  const shareCard = async () => {
    if (!shop) return;
    const text = `New stock at ${shop.businessName}! See it here: ${shareLink}`;
    if (ready) {
      const file = new File([ready.blob], cardFile, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text });
          return;
        } catch (err) {
          // Closed the share sheet: nothing more to do
          if ((err as { name?: string })?.name === "AbortError") return;
        }
      }
    }
    // Phones/computers that can't share pictures: send the link on WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Page>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <LargeTitle
        title="Posters & share images"
        subtitle="Bring more buyers to your shop link · पोस्टर और स्टेटस फ़ोटो"
        back={{ href: shop ? `/vendor/settings?storeId=${shop.id}` : "/vendor/settings", label: "My shop" }}
      />

      {error && <Notice tone="bad">{error}</Notice>}

      {!shop && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-[420px] animate-pulse rounded-2xl bg-card" />
          <div className="h-[420px] animate-pulse rounded-2xl bg-card" />
        </div>
      )}

      {shop && (
        <>
          <section className="mb-8">
            <SectionHeader title="QR poster for your counter" />
            {handle && link ? (
              <div className="rounded-2xl bg-card p-4">
                <p className="text-[17px] font-semibold text-label">Print it and stick it in your shop</p>
                <p className="mt-0.5 text-[14px] text-label-2">Buyers scan it and see your shop on their phone · दुकान में लगाएँ</p>
                <div className="mx-auto mt-4 w-full max-w-[340px] overflow-hidden rounded-xl ring-1 ring-hairline">
                  {qr ? (
                    <Poster name={shop.businessName} logo={shop.storeLogo} link={link} qr={qr} />
                  ) : (
                    <div className="aspect-[1/1.4142] w-full animate-pulse bg-fill" />
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button onClick={() => window.print()} disabled={!qr}>
                    <Printer className="h-5 w-5" aria-hidden /> Print
                  </Button>
                  <Button variant="secondary" onClick={downloadPoster} loading={savingPoster} disabled={!qr || savingPoster}>
                    {!savingPoster && <Download className="h-5 w-5" aria-hidden />} Download image
                  </Button>
                </div>
                <p className="mt-2 text-center text-[13px] text-label-3">Fits A4 or A5 paper · A4 या A5 कागज़ पर छापें</p>
              </div>
            ) : (
              <Notice
                tone="warn"
                icon={<Link2 className="h-5 w-5 text-warn" aria-hidden />}
                action={
                  <Button size="md" href={`/vendor/settings?storeId=${shop.id}`}>
                    Get link
                  </Button>
                }
              >
                <span className="font-semibold">Get your shop link first.</span> The poster shows it so buyers can find you · पहले दुकान का लिंक बनाएँ
              </Notice>
            )}
          </section>

          <section>
            <SectionHeader title="New arrivals picture" />
            <div className="rounded-2xl bg-card p-4">
              <p className="text-[17px] font-semibold text-label">Put your new stock on WhatsApp status</p>
              <p className="mt-0.5 text-[14px] text-label-2">Your 4 newest things with photo and price · नया स्टॉक स्टेटस पर लगाएँ</p>
              <div className="mt-4">
                <Segmented
                  label="Picture shape"
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: "story", label: "Story" },
                    { value: "square", label: "Square" },
                  ]}
                />
                <p className="mt-1.5 px-1 text-[13px] text-label-3">
                  {format === "story" ? "Tall — for WhatsApp status and Instagram story" : "For an Instagram or Facebook post"}
                </p>
              </div>

              <div
                className={`mx-auto mt-4 w-full overflow-hidden rounded-xl bg-fill ${format === "story" ? "aspect-[9/16] max-w-[280px]" : "aspect-square max-w-[340px]"}`}
              >
                {ready ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ready.url} alt="New arrivals picture of your shop" className="h-full w-full object-contain" />
                ) : card === "error" ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                    <p className="text-[15px] text-label-2">Couldn&apos;t make the picture.</p>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setCards((c) => ({ ...c, [format]: undefined }));
                        setRetry((n) => n + 1);
                      }}
                    >
                      Try again
                    </Button>
                  </div>
                ) : (
                  <div className="h-full w-full animate-pulse" role="status" aria-label="Making your picture" />
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => ready && saveFile(ready.url, cardFile)} disabled={!ready}>
                  <Download className="h-5 w-5" aria-hidden /> Download
                </Button>
                <button
                  type="button"
                  onClick={shareCard}
                  disabled={!card}
                  className="flex h-12 items-center justify-center gap-2 rounded-full bg-ok text-[16px] font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                >
                  <WhatsAppIcon className="h-5 w-5" fill="fill-white" /> Share
                </button>
              </div>
              <p className="mt-2 text-center text-[13px] text-label-3">Only things for sale and in stock are shown · सिर्फ़ उपलब्ध सामान</p>
            </div>
          </section>

          {/* The copy that goes to the printer (hidden on screen) */}
          {qr && link && createPortal(
            <div id={PRINT_ID}>
              <Poster name={shop.businessName} logo={shop.storeLogo} link={link} qr={qr} />
            </div>,
            document.body,
          )}
        </>
      )}
    </Page>
  );
}
