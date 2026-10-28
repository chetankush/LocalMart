import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ID = /^[0-9a-f-]{36}$/i;
const CRIMSON = "#D61F45";
const INK = "#111111";
const GREY = "#4B5058";
const FILL = "#F3F3F5";

type Product = {
  id: string;
  name: string;
  price: number | string;
  images?: string[] | null;
  listingType?: string;
  isActive?: boolean;
  stockQuantity?: number | null;
  createdAt?: string;
};
type Shop = { id: string; businessName: string; storeLogo?: string | null; handle?: string | null; products?: Product[] };
type Item = { id: string; name: string; price: string; photo: string | null };
type Font = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: "normal" };

/** "localmart.in" — the site's own address, without https:// */
function siteHost() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "") || "localmart.in";
}

/* ─── Fonts ─────────────────────────────────────────────────────── */

// An old Safari user agent makes Google Fonts hand back plain .ttf files
const OLD_SAFARI =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1";

// Every letter the English parts need, so that download stays small
const LATIN = `${Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("")}₹·–—…‘’“”×`;

async function googleFont(family: string, weight: number, text?: string) {
  const subset = text ? `&text=${encodeURIComponent(text)}` : "";
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}${subset}`, {
    headers: { "User-Agent": OLD_SAFARI },
    signal: AbortSignal.timeout(6000),
  }).then((r) => r.text());
  const file = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
  if (!file) throw new Error(`No font file for ${family}`);
  const res = await fetch(file, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`Font download failed: ${res.status}`);
  return res.arrayBuffer();
}

// Noto Sans for English and ₹, Noto Sans Devanagari for Hindi. Downloaded
// once per server; if Google Fonts can't be reached, next/og's own font is used
// (it fetches Hindi letters by itself, but has no ₹, so prices say "Rs").
let fonts: Promise<Font[] | undefined> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    googleFont("Noto+Sans", 400, LATIN),
    googleFont("Noto+Sans", 700, LATIN),
    // Whole font: Hindi product names can use any letter
    googleFont("Noto+Sans+Devanagari", 600),
  ])
    .then(([regular, bold, hindi]): Font[] => [
      { name: "Noto Sans", data: regular, weight: 400, style: "normal" },
      { name: "Noto Sans", data: bold, weight: 700, style: "normal" },
      { name: "Noto Sans Devanagari", data: hindi, weight: 600, style: "normal" },
    ])
    .catch((err) => {
      console.error("share-card: couldn't load fonts", err);
      // Try again in a few minutes
      setTimeout(() => (fonts = null), 5 * 60_000);
      return undefined;
    });
  return fonts;
}

/* ─── Photos ────────────────────────────────────────────────────── */

/** The file type from its first bytes — next/og can only draw JPEG, PNG and GIF */
function imageType(b: Uint8Array) {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  return null;
}

/** A photo as a data: URL, or null if it can't be fetched or drawn (e.g. WebP) */
async function photo(url?: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const type = imageType(bytes);
    if (!type || bytes.length > 8_000_000) return null;
    return `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  }
}

/** First photo of the product that can be drawn */
async function firstPhoto(urls?: string[] | null) {
  for (const url of (urls ?? []).slice(0, 3)) {
    const p = await photo(url);
    if (p) return p;
  }
  return null;
}

const rupees = (n: number, sign: string) => `${sign}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const short = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

/* ─── The picture ───────────────────────────────────────────────── */

type Layout = {
  width: number;
  height: number;
  pad: number;
  top: number;
  logo: number;
  name: number;
  tag: number;
  cardW: number;
  cardH: number;
  photo: number;
  itemName: number;
  price: number;
  link: number;
  /** Long links get smaller letters: font size ≤ linkFit / number of letters */
  linkFit: number;
  /** Story: photo on top. Square: photo on the left */
  stacked: boolean;
};

// Story keeps clear of the top and bottom strips that WhatsApp/Instagram cover
const STORY: Layout = {
  width: 1080, height: 1920, pad: 48, top: 120, logo: 112, name: 56, tag: 44,
  cardW: 478, cardH: 579, photo: 405, itemName: 29, price: 40, link: 48, linkFit: 1700, stacked: true,
};
const SQUARE: Layout = {
  width: 1080, height: 1080, pad: 56, top: 56, logo: 88, name: 46, tag: 36,
  cardW: 472, cardH: 318, photo: 200, itemName: 27, price: 36, link: 38, linkFit: 1400, stacked: false,
};

function Card({ item, l }: { item: Item; l: Layout }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: l.stacked ? "column" : "row",
        width: l.cardW,
        height: l.cardH,
        backgroundColor: "#FFFFFF",
        borderRadius: 28,
        overflow: "hidden",
      }}
    >
      {item.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photo}
          alt=""
          width={l.stacked ? l.cardW : l.photo}
          height={l.stacked ? l.photo : l.cardH}
          style={{ objectFit: "cover", backgroundColor: FILL }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            width: l.stacked ? l.cardW : l.photo,
            height: l.stacked ? l.photo : l.cardH,
            backgroundColor: FILL,
            alignItems: "center",
            justifyContent: "center",
            color: "#9A9AA0",
            fontSize: l.itemName,
          }}
        >
          No photo
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: l.stacked ? "flex-start" : "center",
          flex: 1,
          padding: l.stacked ? "18px 24px 22px" : "20px 22px",
        }}
      >
        <div
          style={{
            display: "block",
            lineClamp: l.stacked ? 2 : 3,
            fontSize: l.itemName,
            lineHeight: 1.25,
            color: INK,
            maxHeight: l.itemName * 1.25 * (l.stacked ? 2 : 3),
            overflow: "hidden",
          }}
        >
          {short(item.name, l.stacked ? 60 : 70)}
        </div>
        {item.price && (
          <div style={{ display: "flex", marginTop: 8, fontSize: l.price, fontWeight: 700, color: CRIMSON }}>{item.price}</div>
        )}
      </div>
    </div>
  );
}

function ShareCard({ shop, logo, items, link, l }: { shop: Shop; logo: string | null; items: Item[]; link: string; l: Layout }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: l.width,
        height: l.height,
        backgroundColor: CRIMSON,
        padding: `${l.top}px ${l.pad}px`,
        fontFamily: '"Noto Sans", "Noto Sans Devanagari"',
        color: "#FFFFFF",
      }}
    >
      {/* Logo + shop name */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            width={l.logo}
            height={l.logo}
            style={{ borderRadius: l.logo, border: "5px solid #FFFFFF", objectFit: "cover", backgroundColor: "#FFFFFF" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: l.logo,
              height: l.logo,
              borderRadius: l.logo,
              backgroundColor: "#FFFFFF",
              color: CRIMSON,
              fontSize: l.logo * 0.5,
              fontWeight: 700,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {shop.businessName.trim().charAt(0).toUpperCase()}
          </div>
        )}
        <div
          style={{
            display: "block",
            lineClamp: l.stacked ? 2 : 1,
            flex: 1,
            marginLeft: 28,
            fontSize: l.name,
            fontWeight: 700,
            lineHeight: 1.15,
            maxHeight: l.name * 1.15 * (l.stacked ? 2 : 1),
            overflow: "hidden",
          }}
        >
          {short(shop.businessName, l.stacked ? 48 : 30)}
        </div>
      </div>

      {/* "New arrivals" pill */}
      <div style={{ display: "flex", marginTop: l.stacked ? 32 : 22 }}>
        <div
          style={{
            display: "flex",
            backgroundColor: "#FFFFFF",
            color: CRIMSON,
            fontSize: l.tag,
            fontWeight: 700,
            padding: l.stacked ? "16px 36px" : "12px 28px",
            borderRadius: 999,
          }}
        >
          New arrivals · नया स्टॉक
        </div>
      </div>

      {/* Up to 4 newest things, in the middle of the space left */}
      <div style={{ display: "flex", flex: 1, alignItems: "center", margin: l.stacked ? "40px 0" : "28px 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", width: "100%", justifyContent: "center", gap: 24 }}>
          {items.length > 0 ? (
            items.map((item) => <Card key={item.id} item={item} l={l} />)
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                color: INK,
                borderRadius: 28,
                padding: "48px 56px",
                fontSize: l.name,
                fontWeight: 700,
              }}
            >
              <div style={{ display: "flex" }}>Come and see our shop</div>
              <div style={{ display: "flex", marginTop: 12, fontSize: l.tag, color: GREY }}>दुकान पर आइए</div>
            </div>
          )}
        </div>
      </div>

      {/* Short link + brand */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: l.stacked ? "center" : "flex-start" }}>
        {l.stacked && <div style={{ display: "flex", fontSize: 30, opacity: 0.9 }}>See all & order from home</div>}
        <div
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: l.stacked ? "center" : "space-between",
            marginTop: l.stacked ? 8 : 0,
          }}
        >
          <div style={{ display: "flex", fontSize: Math.min(l.link, Math.floor(l.linkFit / Math.max(link.length, 1))), fontWeight: 700 }}>
            {link}
          </div>
          {!l.stacked && <div style={{ display: "flex", fontSize: 28, fontWeight: 700, opacity: 0.9 }}>LocalMart</div>}
        </div>
        {l.stacked && <div style={{ display: "flex", marginTop: 20, fontSize: 28, fontWeight: 700, opacity: 0.9 }}>LocalMart</div>}
      </div>
    </div>
  );
}

/**
 * "New arrivals" picture of a shop for WhatsApp status and Instagram story:
 * the shop's 4 newest things for sale with photo and price, and its short link.
 * ?format=story (1080×1920, default) or ?format=square (1080×1080).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  if (!ID.test(storeId)) return new Response("Unknown shop", { status: 400 });
  const l = request.nextUrl.searchParams.get("format") === "square" ? SQUARE : STORY;

  const res = await fetch(`${API_BASE_URL}/vendors/${storeId}/details`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  const json = res?.ok ? ((await res.json().catch(() => null)) as { data?: Shop } | null) : null;
  const shop = json?.data;
  if (!shop?.businessName) {
    // 404 from the API: no such shop. Anything else: the API is having trouble
    return new Response("Shop not found", { status: res && (res.ok || res.status === 404) ? 404 : 502 });
  }

  // Newest first; only things for sale and in stock
  const fresh = (shop.products ?? [])
    .filter((p) => p.listingType !== "RENT" && p.isActive !== false && (p.stockQuantity ?? 0) > 0)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 8);

  const [logo, photos, fontList] = await Promise.all([
    photo(shop.storeLogo),
    Promise.all(fresh.map((p) => firstPhoto(p.images))),
    loadFonts(),
  ]);

  // Things with a photo look better, so they go first
  const all: Item[] = fresh.map((p, i) => ({
    id: p.id,
    name: p.name,
    price: Number.isFinite(Number(p.price)) ? rupees(Number(p.price), fontList ? "₹" : "Rs ") : "",
    photo: photos[i],
  }));
  const items = [...all.filter((x) => x.photo), ...all.filter((x) => !x.photo)].slice(0, 4);

  const link = `${siteHost()}/${shop.handle || `stores/${shop.id}`}`;
  const options = { width: l.width, height: l.height, fonts: fontList };
  const headers = {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=300, s-maxage=300",
  };

  try {
    const png = await new ImageResponse(<ShareCard shop={shop} logo={logo} items={items} link={link} l={l} />, options).arrayBuffer();
    return new Response(png, { headers });
  } catch (err) {
    // A photo it couldn't read: draw the picture again without photos
    console.error("share-card: drawing failed, trying without photos", err);
    const plain = items.map((x) => ({ ...x, photo: null }));
    const png = await new ImageResponse(<ShareCard shop={shop} logo={null} items={plain} link={link} l={l} />, options).arrayBuffer();
    return new Response(png, { headers });
  }
}
