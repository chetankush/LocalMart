/**
 * Reading a shop's UPI QR (a photo of its GPay / PhonePe / Paytm / BharatQR
 * sticker) to get the UPI ID inside it — on the seller's phone, nothing sent
 * anywhere. With the UPI ID, buyers get the one-tap "Pay ₹959" button with
 * the amount and order number filled in.
 */
import jsQR from "jsqr";

/** Same rule as the server's UPI ID check */
const VPA = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/;

/**
 * BharatQR / merchant stickers use the EMV format: two-digit tag, two-digit
 * length, value — with the UPI ID inside one of the account fields (26–51).
 */
function emvValues(text: string): string[] {
  const out: string[] = [];
  const walk = (s: string, nested: boolean) => {
    let i = 0;
    while (i + 4 <= s.length) {
      const tag = Number(s.slice(i, i + 2));
      const len = Number(s.slice(i + 2, i + 4));
      if (!Number.isInteger(tag) || !Number.isInteger(len)) return;
      const value = s.slice(i + 4, i + 4 + len);
      if (value.length < len) return;
      // Account fields hold more fields inside: look at those, not the whole block
      if (!nested && tag >= 26 && tag <= 51) walk(value, true);
      else out.push(value);
      i += 4 + len;
    }
  };
  walk(text, false);
  return out;
}

/** The UPI ID (and payee name, if any) in a QR's text, or null */
export function parseUpiText(text: string): { upiId: string; name: string | null } | null {
  const t = text.trim();
  // The usual UPI QR: upi://pay?pa=shop@okaxis&pn=Radhe%20Saree&...
  if (/^upi:\/\//i.test(t)) {
    const query = t.slice(t.indexOf("?") + 1);
    const params = new URLSearchParams(query);
    const pa = (params.get("pa") ?? "").trim();
    if (VPA.test(pa)) return { upiId: pa.toLowerCase(), name: params.get("pn")?.trim() || null };
    return null;
  }
  // BharatQR / merchant stickers carry the UPI ID inside an account field
  if (/^0002/.test(t)) {
    const values = emvValues(t);
    const vpa = values.find((v) => VPA.test(v.trim()));
    // Tag 59 is the shop's name on the sticker
    if (vpa) return { upiId: vpa.trim().toLowerCase(), name: null };
  }
  return null;
}

type Point = { x: number; y: number };

/** Cuts just the QR out of the photo (plus a white border), so buyers get a big, clear code */
async function cropQr(
  img: HTMLImageElement,
  loc: { topLeftCorner: Point; topRightCorner: Point; bottomLeftCorner: Point; bottomRightCorner: Point },
  scale: number,
): Promise<Blob | null> {
  const pts = [loc.topLeftCorner, loc.topRightCorner, loc.bottomLeftCorner, loc.bottomRightCorner].map((p) => ({ x: p.x / scale, y: p.y / scale }));
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const side = Math.max(maxX - minX, maxY - minY);
  const pad = side * 0.12;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(img.naturalWidth - sx, side + pad * 2);
  const sh = Math.min(img.naturalHeight - sy, side + pad * 2);
  const out = Math.min(800, Math.round(Math.max(sw, sh)));
  const c = document.createElement("canvas");
  c.width = out;
  c.height = out;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, out, out);
  const k = out / Math.max(sw, sh);
  ctx.drawImage(img, sx, sy, sw, sh, (out - sw * k) / 2, (out - sh * k) / 2, sw * k, sh * k);
  return new Promise((resolve) => c.toBlob((b) => resolve(b), "image/png"));
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("not an image"));
    };
    img.src = url;
  });
}

/**
 * Finds the QR in a photo (tries a few sizes — phone photos are big and often
 * slightly blurry) and reads the UPI ID from it.
 */
export async function readUpiQr(
  file: File,
): Promise<
  | { ok: true; upiId: string; name: string | null; /** just the QR (with a white border), for buyers to scan */ cropped: Blob | null }
  | { ok: false; reason: "no-qr" | "not-upi" | "not-image" }
> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return { ok: false, reason: "not-image" };
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { ok: false, reason: "no-qr" };
  let sawQr = false;
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  for (const target of [1000, 1600, 700, longest]) {
    const scale = Math.min(1, target / longest);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
    if (code?.data) {
      sawQr = true;
      const upi = parseUpiText(code.data);
      if (upi) return { ok: true, ...upi, cropped: await cropQr(img, code.location, scale) };
    }
  }
  return { ok: false, reason: sawQr ? "not-upi" : "no-qr" };
}
