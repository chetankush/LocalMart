import type { Metadata } from "next";
import MapExplorer from "./MapExplorer";

export const metadata: Metadata = {
  title: "Shops near you on the map | LocalMart",
  description: "See every LocalMart shop around you on the map — sarees, kirana, medicines, mobiles and more. Find who sells what, how far it is, and get directions.",
};

export default async function MapPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q, type } = await searchParams;
  return <MapExplorer initialQuery={q ?? ""} initialType={type ?? null} />;
}
