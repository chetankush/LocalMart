"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Pill } from "@/components/app/ui";
import { inputClass } from "@/components/app/form";
import { List, SectionHeader, StatGrid, StatTile } from "@/components/app/seller";
import { AdminPage, EmptyBlock, LoadingBlock, TableCard, tdClass, thClass, trClass } from "@/components/app/admin";
import { apiError } from "@/components/ads/adLabels";
import { visitStatus, visitWhen, type ShopVisit } from "@/lib/visits";

interface ShopRow {
  id: string;
  businessName: string;
  city: string;
  booked: number;
  came: number;
  bought: number;
  noShow: number;
  cancelled: number;
  notMarked: number;
}

const thisMonth = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 7);
const rate = (came: number, booked: number) => (booked > 0 ? `${Math.round((came / booked) * 100)}%` : "–");

/**
 * Shop visits by month: how many each shop got and how many came — the
 * numbers shops will be billed on once visits are paid.
 */
export default function AdminVisitsPage() {
  const [month, setMonth] = useState(thisMonth());
  const [shops, setShops] = useState<ShopRow[] | null>(null);
  const [recent, setRecent] = useState<ShopVisit[]>([]);

  const load = useCallback(async (m: string) => {
    setShops(null);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.get<{ data: { shops: ShopRow[]; recent: ShopVisit[] } }>(`/admin/visits?month=${m}`);
      setShops(res.data.shops);
      setRecent(res.data.recent);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't load visits.");
      setShops([]);
    }
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  const total = (k: keyof Omit<ShopRow, "id" | "businessName" | "city">) =>
    (shops ?? []).reduce((sum, s) => sum + s[k], 0);

  return (
    <AdminPage
      title="Shop visits"
      subtitle="Visits customers booked, and whether they came"
      actions={
        <input
          type="month"
          aria-label="Month"
          className={`${inputClass} h-10 w-44`}
          value={month}
          max={thisMonth()}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
        />
      }
    >
      {shops === null ? (
        <LoadingBlock label="Loading visits…" />
      ) : shops.length === 0 ? (
        <EmptyBlock
          icon={<CalendarCheck className="h-6 w-6" aria-hidden />}
          title="No visits this month"
          body="When customers book visits from shop pages, they show here."
        />
      ) : (
        <>
          <div className="mb-6">
            <StatGrid>
              <StatTile label="Booked" value={total("booked")} />
              <StatTile
                label="Came"
                value={total("came")}
                tone="ok"
                hint={`${rate(total("came"), total("booked"))} showed up`}
              />
              <StatTile label="Bought" value={total("bought")} tone="ok" />
              <StatTile
                label="Not marked yet"
                value={total("notMarked")}
                tone={total("notMarked") > 0 ? "warn" : undefined}
              />
            </StatGrid>
          </div>

          <SectionHeader title="By shop" />
          <TableCard className="mb-8">
            <thead>
              <tr>
                <th className={thClass}>Shop</th>
                <th className={thClass}>Booked</th>
                <th className={thClass}>Came</th>
                <th className={thClass}>Bought</th>
                <th className={thClass}>Didn&apos;t come</th>
                <th className={thClass}>Not marked</th>
                <th className={thClass}>Showed up</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id} className={trClass}>
                  <td className={tdClass}>
                    <p className="font-semibold">{s.businessName}</p>
                    <p className="text-[13px] text-label-2">{s.city}</p>
                  </td>
                  <td className={`${tdClass} tabular-nums`}>{s.booked}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.came}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.bought}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.noShow}</td>
                  <td className={`${tdClass} tabular-nums`}>{s.notMarked}</td>
                  <td className={`${tdClass} tabular-nums`}>{rate(s.came, s.booked)}</td>
                </tr>
              ))}
            </tbody>
          </TableCard>
          <div className="mb-8 md:hidden">
            <List>
              {shops.map((s) => (
                <div key={s.id} className="p-4">
                  <p className="text-[16px] font-semibold text-label">{s.businessName}</p>
                  <p className="text-[14px] text-label-2">
                    {s.booked} booked · {s.came} came · {s.bought} bought · {s.noShow} didn&apos;t come ·{" "}
                    {rate(s.came, s.booked)} showed up
                  </p>
                </div>
              ))}
            </List>
          </div>

          <SectionHeader title="Latest visits" />
          <List>
            {recent.map((v) => {
              const st = visitStatus(v.status);
              return (
                <div key={v.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-label">
                      {v.customerName} → {v.vendor?.businessName}
                    </p>
                    <p className="text-[14px] text-label-2">{visitWhen(v.startsAt)}</p>
                  </div>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </div>
              );
            })}
          </List>
        </>
      )}
    </AdminPage>
  );
}
