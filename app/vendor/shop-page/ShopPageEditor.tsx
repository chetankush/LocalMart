"use client";

import { refreshShopPage } from "@/lib/refreshShopPage";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Check, Eye, ImageIcon, Images, Loader2, RotateCcw, X } from "lucide-react";
import { Button, Notice } from "@/components/app/ui";
import { SectionHeader } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  SAREE_FABRICS,
  SAREE_OCCASIONS,
  type Collection,
  fabricSpot,
  imageList,
  matchesCollection,
  occasionSpot,
  pageImagesOf,
  searchTextOf,
} from "@/lib/shop-page";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  tags?: string[] | null;
  category?: { name?: string | null } | null;
  images: unknown;
}

interface Shop {
  id: string;
  businessName: string;
  storeTheme: string;
  storeImages: unknown;
  themeCustomization: unknown;
}

interface Tile {
  spot: string;
  label: string;
  count: number;
  /** The photo the shop page uses when the seller hasn't chosen one */
  autoPhoto: string | null;
  /** Products in this tile — their photos are offered first */
  productPhotos: string[];
}

const MAX_MAIN_PHOTOS = 5;
const MAX_FILE_MB = 5;

const LOOK_NAME: Record<string, string> = {
  SAREE: "Saree shop",
  CONSTRUCTION: "Construction & rental",
  CLOTHING: "Clothes shop",
  KIRANA: "Kirana shop",
  GROCERY: "Grocery & general",
};

/** Upload a photo from the phone; returns its link or null (and says why) */
async function uploadPhoto(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    toast.error("Please choose a photo");
    return null;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    toast.error(`This photo is too big. Please choose one under ${MAX_FILE_MB} MB.`);
    return null;
  }
  try {
    const { apiClient } = await import("@/lib/api/client");
    const result = await apiClient.vendorUpload(file, "stores");
    if (result.success && result.url) return result.url;
    toast.error("Couldn't upload the photo. Please try again.");
  } catch (error: any) {
    toast.error(error?.message || "Couldn't upload the photo. Please try again.");
  }
  return null;
}

export default function ShopPageEditor({ shop, products }: { shop: Shop; products: Product[] }) {
  const [mainPhotos, setMainPhotos] = useState<string[]>(() => imageList(shop.storeImages));
  const [pageImages, setPageImages] = useState<Record<string, string>>(() => pageImagesOf(shop.themeCustomization));
  const [busy, setBusy] = useState<string | null>(null); // "main" or a tile spot
  const [editing, setEditing] = useState<Tile | null>(null);
  const mainInput = useRef<HTMLInputElement>(null);

  const allProductPhotos = useMemo(
    () => Array.from(new Set(products.flatMap((p) => imageList(p.images)))),
    [products],
  );

  // Same tiles the shop page shows: only the ones that have products
  const tilesFor = useMemo(() => {
    const text = new Map(products.map((p) => [p.id, searchTextOf(p)]));
    return (collections: Collection[], spotOf: (key: string) => string): Tile[] =>
      collections
        .map((c) => {
          const matched = products.filter((p) => matchesCollection(text.get(p.id) || "", c));
          const photos = Array.from(new Set(matched.flatMap((p) => imageList(p.images))));
          return { spot: spotOf(c.key), label: c.label, count: matched.length, autoPhoto: photos[0] ?? null, productPhotos: photos };
        })
        .filter((t) => t.count > 0);
  }, [products]);

  const isSaree = shop.storeTheme === "SAREE";
  const fabricTiles = isSaree ? tilesFor(SAREE_FABRICS, fabricSpot) : [];
  const occasionTiles = isSaree ? tilesFor(SAREE_OCCASIONS, occasionSpot) : [];

  const save = async (data: { storeImages?: string[]; pageImages?: Record<string, string | null> }) => {
    const { apiClient } = await import("@/lib/api/client");
    const res = await apiClient.updateShopPage(data, shop.id);
    setMainPhotos(imageList(res.data.storeImages));
    setPageImages(res.data.pageImages || {});
    // Show it to customers now, not when the page cache runs out
    void refreshShopPage(shop.id);
  };

  /* ── Main photos ── */

  const addMainPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_MAIN_PHOTOS - mainPhotos.length;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_MAIN_PHOTOS} main photos. Remove one first.`);
      return;
    }
    setBusy("main");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const url = await uploadPhoto(file);
        if (url) uploaded.push(url);
      }
      if (uploaded.length) {
        await save({ storeImages: [...mainPhotos, ...uploaded] });
        toast.success(uploaded.length === 1 ? "Photo added to your shop page" : `${uploaded.length} photos added`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Couldn't save. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const removeMainPhoto = async (url: string) => {
    setBusy("main");
    try {
      await save({ storeImages: mainPhotos.filter((p) => p !== url) });
      toast.success("Photo removed");
    } catch (error: any) {
      toast.error(error?.message || "Couldn't save. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const makeFirst = async (url: string) => {
    setBusy("main");
    try {
      await save({ storeImages: [url, ...mainPhotos.filter((p) => p !== url)] });
      toast.success("This photo now shows first");
    } catch (error: any) {
      toast.error(error?.message || "Couldn't save. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  /* ── Tile photos ── */

  const setTilePhoto = async (tile: Tile, url: string | null) => {
    setBusy(tile.spot);
    try {
      await save({ pageImages: { [tile.spot]: url } });
      toast.success(url ? `Photo set for ${tile.label}` : `${tile.label} uses a product photo again`);
      setEditing(null);
    } catch (error: any) {
      toast.error(error?.message || "Couldn't save. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const uploadTilePhoto = async (tile: Tile, file: File | undefined) => {
    if (!file) return;
    setBusy(tile.spot);
    const url = await uploadPhoto(file);
    if (url) await setTilePhoto(tile, url);
    else setBusy(null);
  };

  return (
    <div className="pb-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button href={`/stores/${shop.id}`} variant="secondary" size="md">
          <Eye className="h-[18px] w-[18px]" aria-hidden />
          See my shop page
        </Button>
        <span className="text-[14px] text-label-2">Changes show to customers right away.</span>
      </div>

      {/* ── Main photos ── */}
      <section className="mb-8">
        <SectionHeader title={`Main photos · ${mainPhotos.length} of ${MAX_MAIN_PHOTOS}`} />
        <div className="rounded-2xl bg-card p-4">
          <p className="text-[15px] leading-snug text-label-2">
            The big photos at the top of your shop page. Your shop front, your counter or your best products.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mainPhotos.map((url, i) => (
              <figure key={url} className="relative overflow-hidden rounded-2xl bg-fill">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Main photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                {i === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-label/80 px-2.5 py-1 text-[12px] font-semibold text-white">
                    Shows first
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeFirst(url)}
                    disabled={!!busy}
                    className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-semibold text-label disabled:opacity-50 cursor-pointer"
                  >
                    Show first
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeMainPhoto(url)}
                  disabled={!!busy}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-50 cursor-pointer"
                  aria-label={`Remove main photo ${i + 1}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </figure>
            ))}

            {mainPhotos.length < MAX_MAIN_PHOTOS && (
              <button
                type="button"
                onClick={() => mainInput.current?.click()}
                disabled={busy === "main"}
                className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-hairline bg-fill text-center transition-colors hover:border-tint/40 disabled:opacity-60 cursor-pointer"
              >
                {busy === "main" ? (
                  <Loader2 className="h-7 w-7 animate-spin text-tint" aria-hidden />
                ) : (
                  <Camera className="h-7 w-7 text-tint" aria-hidden />
                )}
                <span className="text-[15px] font-semibold text-label">{busy === "main" ? "Adding…" : "Add photo"}</span>
                <span className="text-[13px] text-label-2">फ़ोटो जोड़ें</span>
              </button>
            )}
          </div>
          <input
            ref={mainInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addMainPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </section>

      {/* ── Section tiles (Saree look) ── */}
      {isSaree ? (
        <>
          <TileSection
            title="Shop by Fabric"
            description="One photo for each fabric. Leave it and we use one of your saree photos."
            tiles={fabricTiles}
            pageImages={pageImages}
            busy={busy}
            onEdit={setEditing}
          />
          <TileSection
            title="Shop by Occasion"
            description="Photos for Wedding, Festive, Party and more."
            tiles={occasionTiles}
            pageImages={pageImages}
            busy={busy}
            onEdit={setEditing}
          />
          <p className="px-1 text-[14px] leading-snug text-label-2">
            A fabric or occasion appears here once you have sarees for it — for example, add a “Georgette saree” and
            a Georgette spot shows up.
          </p>
        </>
      ) : (
        <Notice tone="info" icon={<ImageIcon className="h-5 w-5 text-info" aria-hidden />}>
          Your shop look is <span className="font-semibold">{LOOK_NAME[shop.storeTheme] ?? "Standard"}</span>. It uses
          your main photos above. Photo spots for each section are coming for this look soon.
        </Notice>
      )}

      {/* ── Change one tile's photo ── */}
      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Photo for ${editing.label}` : undefined}
        description="Choose a photo customers will tap to see these sarees."
        wide
      >
        {editing && (
          <TilePhotoPicker
            tile={editing}
            current={pageImages[editing.spot]}
            otherPhotos={allProductPhotos}
            busy={busy === editing.spot}
            onUpload={(file) => uploadTilePhoto(editing, file)}
            onChoose={(url) => setTilePhoto(editing, url)}
            onReset={() => setTilePhoto(editing, null)}
          />
        )}
      </Sheet>
    </div>
  );
}

function TileSection({
  title,
  description,
  tiles,
  pageImages,
  busy,
  onEdit,
}: {
  title: string;
  description: string;
  tiles: Tile[];
  pageImages: Record<string, string>;
  busy: string | null;
  onEdit: (tile: Tile) => void;
}) {
  if (tiles.length === 0) return null;
  return (
    <section className="mb-8">
      <SectionHeader title={title} />
      <p className="mb-3 px-1 text-[15px] leading-snug text-label-2">{description}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => {
          const own = pageImages[tile.spot];
          const photo = own || tile.autoPhoto;
          return (
            <button
              key={tile.spot}
              type="button"
              onClick={() => onEdit(tile)}
              className="group overflow-hidden rounded-2xl bg-card text-left transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span className="relative block aspect-[4/5] bg-fill">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-full w-full object-cover object-top" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-label-3">
                    <ImageIcon className="h-10 w-10" aria-hidden />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
                  <span className="block text-[16px] font-semibold leading-tight text-white">{tile.label}</span>
                  <span className="block text-[13px] text-white/85">
                    {tile.count} {tile.count === 1 ? "saree" : "sarees"}
                  </span>
                </span>
                {busy === tile.spot && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <Loader2 className="h-7 w-7 animate-spin text-tint" aria-hidden />
                  </span>
                )}
              </span>
              {own ? (
                <span className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="flex items-center gap-1 text-[13px] font-medium text-ok">
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                    Your photo
                  </span>
                  <span className="whitespace-nowrap text-[14px] font-semibold text-tint">Change</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-[14px] font-semibold text-tint">
                  <Camera className="h-4 w-4" aria-hidden />
                  Add your photo
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function TilePhotoPicker({
  tile,
  current,
  otherPhotos,
  busy,
  onUpload,
  onChoose,
  onReset,
}: {
  tile: Tile;
  current?: string;
  otherPhotos: string[];
  busy: boolean;
  onUpload: (file: File | undefined) => void;
  onChoose: (url: string) => void;
  onReset: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  // This tile's own saree photos first, then the rest of the shop's
  const photos = [...tile.productPhotos, ...otherPhotos.filter((p) => !tile.productPhotos.includes(p))];

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left transition-colors active:bg-fill disabled:opacity-60 cursor-pointer"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tint text-white">
          {busy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Camera className="h-6 w-6" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold text-label">{busy ? "Uploading…" : "Upload a photo"}</span>
          <span className="block text-[14px] text-label-2">From your phone or camera · फ़ोटो जोड़ें</span>
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {photos.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 px-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">
            <Images className="h-4 w-4" aria-hidden />
            Or pick one of your product photos
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.slice(0, 24).map((url) => {
              const on = url === current;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => onChoose(url)}
                  disabled={busy}
                  aria-pressed={on}
                  className={`relative overflow-hidden rounded-xl bg-fill disabled:opacity-60 cursor-pointer ${
                    on ? "ring-2 ring-tint ring-offset-2" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="aspect-[4/5] w-full object-cover object-top" />
                  {on && (
                    <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-tint text-white">
                      <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {current && (
        <button
          type="button"
          onClick={onReset}
          disabled={busy}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label hover:bg-fill disabled:opacity-60 cursor-pointer"
        >
          <RotateCcw className="h-[18px] w-[18px]" aria-hidden />
          Use a product photo instead
        </button>
      )}
    </div>
  );
}
