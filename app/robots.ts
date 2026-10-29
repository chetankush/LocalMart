import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/** Let search engines read shops and products; keep private screens out */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/vendor",
          "/admin",
          "/cart",
          "/checkout",
          "/my-orders",
          "/orders",
          "/profile",
          "/favorite-stores",
          "/notifications",
          "/sign-in",
          "/sign-up",
          "/phone-signin",
          "/auth",
          "/api",
        ],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
