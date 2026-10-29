import Image from "next/image";
import { shopPictures } from "@/lib/landing/shopImages";

/** 16:9 picture for a shop: banner, product collage, or category photo */
export default function ShopCover({
  shop,
  className = "",
  sizes = "(max-width: 640px) 80vw, 400px",
}: {
  shop: Parameters<typeof shopPictures>[0];
  className?: string;
  sizes?: string;
}) {
  const { banner, collage, fallback } = shopPictures(shop);
  const box = `relative overflow-hidden bg-fill ${className}`;

  if (!banner && collage.length >= 3) {
    return (
      <div className={`${box} grid grid-cols-[2fr_1fr] grid-rows-2 gap-0.5`}>
        <div className="relative row-span-2">
          <Image src={collage[0]} alt="" fill sizes={sizes} className="object-cover" />
        </div>
        <div className="relative">
          <Image src={collage[1]} alt="" fill sizes="200px" className="object-cover" />
        </div>
        <div className="relative">
          <Image src={collage[2]} alt="" fill sizes="200px" className="object-cover" />
        </div>
      </div>
    );
  }

  return (
    <div className={box}>
      <Image src={banner ?? collage[0] ?? fallback} alt="" fill sizes={sizes} className="object-cover" />
    </div>
  );
}
