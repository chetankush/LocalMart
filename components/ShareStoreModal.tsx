"use client";

import { useState, useRef } from "react";
import { X, Copy, Check, Share2, QrCode, Download, MessageCircle, Facebook, Twitter } from "lucide-react";

interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  storeDescription?: string | null;
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

  if (!isOpen) return null;

  const storeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/stores/${storeId}`
    : `/stores/${storeId}`;

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

  // QR Code generation using canvas
  const QRCodeCanvas = ({ value, size = 200 }: { value: string; size?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Generate QR code on mount
    useState(() => {
      const generateQR = async () => {
        if (!canvasRef.current) return;

        // Dynamic import of qrcode library
        try {
          const QRCode = (await import("qrcode")).default;
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
        } catch (err) {
          // Fallback: Draw a placeholder with the URL
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#f3f4f6";
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = "#6b7280";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("QR Code", size / 2, size / 2 - 10);
            ctx.fillText("(Install qrcode package)", size / 2, size / 2 + 10);
          }
        }
      };
      generateQR();
    });

    return (
      <canvas
        ref={canvasRef}
        id="qr-canvas"
        width={size}
        height={size}
        className="mx-auto rounded-lg"
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Share Your Store</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("share")}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "share"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Share2 className="w-4 h-4 inline-block mr-2" />
            Share Links
          </button>
          <button
            onClick={() => setActiveTab("qr")}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "qr"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <QrCode className="w-4 h-4 inline-block mr-2" />
            QR Code
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "share" ? (
            <div className="space-y-4">
              {/* Store URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Store Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={storeUrl}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      copied
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Share via
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${whatsappText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>

                  {/* Facebook */}
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Facebook className="w-5 h-5" />
                    Facebook
                  </a>

                  {/* Twitter */}
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors cursor-pointer"
                  >
                    <Twitter className="w-5 h-5" />
                    Twitter
                  </a>

                  {/* Native Share (Mobile) */}
                  {typeof navigator !== "undefined" && navigator.share && (
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-5 h-5" />
                      More
                    </button>
                  )}
                </div>
              </div>

              {/* Pre-written message */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2 font-medium">
                  Suggested message for your customers:
                </p>
                <p className="text-sm text-gray-700 italic">
                  "{shareText}"
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code */}
              <div ref={qrRef} className="text-center">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                  <QRCodeCanvas value={storeUrl} size={200} />
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  Scan this QR code to visit <strong>{storeName}</strong>
                </p>
              </div>

              {/* QR Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadQR}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={handlePrintQR}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <QrCode className="w-5 h-5" />
                  Print
                </button>
              </div>

              {/* Tips */}
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  Tips for using QR Code:
                </p>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>- Print and display at your store counter</li>
                  <li>- Add to your visiting cards</li>
                  <li>- Include in product packaging</li>
                  <li>- Share on social media stories</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
