"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Check, Share2, QrCode, Download, MessageCircle, Facebook, Printer, Twitter } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { Segmented } from "@/components/app/form";

interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  storeDescription?: string | null;
}

// QR code drawn on a canvas (module level so it isn't re-created on every render)
function QRCodeCanvas({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const generateQR = async () => {
      if (!canvasRef.current) return;
      try {
        // qrcode ships no .d.ts; suppress TS7016 inline
        // @ts-expect-error - qrcode has no bundled type declarations
        const QRCode = (await import("qrcode")).default;
        if (cancelled || !canvasRef.current) return;
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: { dark: "#111111", light: "#FFFFFF" },
        });
      } catch {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#F3F3F5";
          ctx.fillRect(0, 0, size, size);
          ctx.fillStyle = "#4B5058";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("QR unavailable", size / 2, size / 2);
        }
      }
    };
    generateQR();
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return <canvas ref={canvasRef} id="qr-canvas" width={size} height={size} className="mx-auto" />;
}

export default function ShareStoreModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  storeDescription,
}: ShareStoreModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"share" | "qr">("share");
  const qrRef = useRef<HTMLDivElement>(null);
  // The shop's short link (localmart.in/radhe-saree), when it has one
  const [handle, setHandle] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    import("@/lib/api/client").then(async ({ apiClient }) => {
      try {
        const r = await apiClient.get<{ data: { handle: string | null } }>(`/vendor/shop-link?storeId=${encodeURIComponent(storeId)}`);
        if (alive) setHandle(r.data?.handle ?? null);
      } catch {
        // Falls back to the long link
      }
    });
    return () => {
      alive = false;
    };
  }, [isOpen, storeId]);

  if (!isOpen) return null;

  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  const storeUrl = handle ? `${origin}/${handle}` : `${origin}/stores/${storeId}`;

  const shareText = `Check out ${storeName} on LocalMart! Shop local products and get them delivered.`;
  const whatsappText = encodeURIComponent(`${shareText}\n\n${storeUrl}`);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(storeUrl)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: shareText,
          url: storeUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("#qr-canvas") as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `${storeName.replace(/\s+/g, "-")}-QR.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handlePrintQR = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const canvas = document.querySelector("#qr-canvas") as HTMLCanvasElement;
      const qrDataUrl = canvas?.toDataURL("image/png") || "";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${storeName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              text-align: center;
              border: 2px solid #000;
              padding: 30px;
              border-radius: 12px;
              max-width: 400px;
            }
            .store-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .tagline {
              font-size: 14px;
              color: #666;
              margin-bottom: 20px;
            }
            .qr-code {
              margin: 20px 0;
            }
            .qr-code img {
              width: 200px;
              height: 200px;
            }
            .scan-text {
              font-size: 16px;
              font-weight: 500;
              margin-top: 15px;
            }
            .url {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
              word-break: break-all;
            }
            .brand {
              margin-top: 20px;
              font-size: 12px;
              color: #999;
            }
            @media print {
              body { padding: 0; }
              .container { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="store-name">${storeName}</div>
            <div class="tagline">Shop local, support local</div>
            <div class="qr-code">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="scan-text">Scan to visit our store</div>
            <div class="url">${storeUrl}</div>
            <div class="brand">Powered by LocalMart</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title="Share your shop"
      description="Customers open your link and order from you · दुकान का लिंक भेजें"
    >
      <div className="mb-4">
        <Segmented
          label="How to share"
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "share", label: <><Share2 className="h-4 w-4" aria-hidden /> Link</> },
            { value: "qr", label: <><QrCode className="h-4 w-4" aria-hidden /> QR code</> },
          ]}
        />
      </div>

      {activeTab === "share" ? (
        <div className="space-y-4">
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-full bg-ok px-6 text-[17px] font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
          >
            <MessageCircle className="h-[22px] w-[22px]" aria-hidden />
            Send on WhatsApp
          </a>

          <div className="rounded-2xl bg-card p-4">
            <label htmlFor="share-link" className="mb-1.5 block text-[15px] font-semibold text-label">
              Your shop link
            </label>
            <div className="flex gap-2">
              <input
                id="share-link"
                type="text"
                value={storeUrl}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
                className="h-12 min-w-0 flex-1 rounded-xl bg-fill px-3 text-[15px] text-label-2 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex h-12 shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition-colors cursor-pointer ${
                  copied ? "bg-ok-soft text-ok" : "bg-label text-white"
                }`}
              >
                {copied ? <Check className="h-[18px] w-[18px]" aria-hidden /> : <Copy className="h-[18px] w-[18px]" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label hover:bg-fill cursor-pointer"
              >
                <Share2 className="h-[18px] w-[18px]" aria-hidden />
                More ways to share
              </button>
            )}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label hover:bg-fill"
            >
              <Facebook className="h-[18px] w-[18px]" aria-hidden />
              Facebook
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label hover:bg-fill"
            >
              <Twitter className="h-[18px] w-[18px]" aria-hidden />
              X (Twitter)
            </a>
          </div>

          <div className="rounded-2xl bg-card p-4">
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">Customers will get</p>
            <p className="mt-2 text-[15px] leading-snug text-label">{shareText}</p>
            {storeDescription && <p className="mt-1 text-[14px] leading-snug text-label-2">{storeDescription}</p>}
            <p className="mt-1 truncate text-[15px] text-info">{storeUrl}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div ref={qrRef} className="rounded-3xl bg-card px-4 py-6 text-center">
            <div className="inline-block rounded-2xl border border-hairline p-3">
              <QRCodeCanvas value={storeUrl} size={200} />
            </div>
            <p className="mt-3 text-[17px] font-semibold text-label">{storeName}</p>
            <p className="mx-auto mt-1 max-w-xs text-[15px] leading-snug text-label-2">
              Print it and stick it at your counter. Customers scan it with their phone camera to order.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label hover:bg-fill cursor-pointer"
            >
              <Download className="h-[18px] w-[18px]" aria-hidden />
              Save photo
            </button>
            <button
              type="button"
              onClick={handlePrintQR}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-cta text-[15px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
            >
              <Printer className="h-[18px] w-[18px]" aria-hidden />
              Print poster
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
