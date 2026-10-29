"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Users } from "lucide-react";
import { Button, Pill, Row, formatDateIST } from "@/components/app/ui";
import { Segmented } from "@/components/app/form";
import { List, SectionHeader } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  AdminPage,
  Avatar,
  Chips,
  Detail,
  DetailGrid,
  EmptyBlock,
  LoadingBlock,
  Pagination,
  SearchField,
  StatusPill,
  TableCard,
  Toolbar,
  statusInfo,
  tdClass,
  thClass,
  trClass,
} from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

interface User {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; vendors: number };
}

const ROLE_FILTERS = [
  { value: "", label: "All" },
  { value: "CUSTOMER", label: "Shoppers" },
  { value: "VENDOR", label: "Sellers" },
  { value: "ADMIN", label: "Admins" },
];

// No "Admin" here on purpose: admin access is only given on the server
// (scripts/set-admin.ts), never from this screen
const ROLE_OPTIONS = [
  { value: "CUSTOMER", label: "Shopper" },
  { value: "VENDOR", label: "Seller" },
];

// "an admin", "a seller", "a shopper"
const withArticle = (role: string) => {
  const label = statusInfo(role).label.toLowerCase();
  return `${/^[aeiou]/.test(label) ? "an" : "a"} ${label}`;
};

const ROLE_EFFECT: Record<string, string> = {
  VENDOR: "They get a seller account. They still need an approved shop to sell.",
  CUSTOMER: "They lose seller access and can only shop.",
};

// What the person can do with their current role
const ROLE_NOW: Record<string, string> = {
  CUSTOMER: "Can shop on LocalMart.",
  VENDOR: "Can run a shop on LocalMart once it is approved.",
  ADMIN: "Can open this admin area and change shops, orders and people.",
};

const countLabel = (n: number, role: string) => {
  const one: Record<string, string> = { CUSTOMER: "shopper", VENDOR: "seller", ADMIN: "admin" };
  if (!role) return `${n} ${n === 1 ? "person" : "people"}`;
  return `${n} ${one[role] ?? "person"}${n === 1 ? "" : "s"}`;
};

function AccountPill({ active }: { active: boolean }) {
  return active ? <Pill tone="ok">Active</Pill> : <Pill tone="bad">Blocked</Pill>;
}

export default function AdminUsersPage() {
  const confirm = useConfirm();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Read from the list so the sheet shows fresh data after a change
  const selected = users.find((u) => u.id === selectedId) ?? null;

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, search, page]);

  // Search as you type (after a short pause); Enter searches straight away
  useEffect(() => {
    const q = searchInput.trim();
    if (q === search) return;
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import("@/lib/api/client");
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", "20");

      const result = await apiClient.get<any>(`/admin/users?${params}`);
      setUsers(result.data?.users || []);
      setTotalPages(result.data?.pagination?.totalPages || 1);
      setTotal(result.data?.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Couldn't load people");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentlyActive: boolean) => {
    const name = users.find((u) => u.id === userId)?.fullName || "this person";
    if (currentlyActive) {
      const ok = await confirm({
        title: `Block ${name}?`,
        description: "They can't use their LocalMart account until you unblock it.",
        confirmLabel: "Block account",
        destructive: true,
      });
      if (!ok) return;
    }

    try {
      setUpdatingId(userId);
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/admin/users/${userId}`, {
        isActive: !currentlyActive,
      });
      toast.success(currentlyActive ? `${name} is blocked` : `${name} can use LocalMart again`);
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to update user:", error);
      toast.error(error?.message || "Couldn't change this account");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = users.find((u) => u.id === userId);
    if (user?.role === newRole) return;
    const name = user?.fullName || "this person";
    const ok = await confirm({
      title: `Make ${name} ${withArticle(newRole)}?`,
      description: ROLE_EFFECT[newRole],
      confirmLabel: "Change role",
    });
    if (!ok) return;

    try {
      setUpdatingId(userId);
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/admin/users/${userId}`, { role: newRole });
      toast.success(`${name} is now ${withArticle(newRole)}`);
      await fetchUsers();
    } catch (error: any) {
      console.error("Failed to change role:", error);
      toast.error(error?.message || "Couldn't change the role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const changePage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const contact = (u: User) => u.email || u.phone || "No contact given";
  const filterLabel = ROLE_FILTERS.find((f) => f.value === roleFilter)?.label ?? "";

  return (
    <AdminPage title="People" subtitle="Everyone with a LocalMart account. Tap someone to change their role or block them.">
      <Toolbar>
        <Chips
          label="Filter people"
          options={ROLE_FILTERS}
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        />
        <form role="search" onSubmit={handleSearch}>
          <SearchField value={searchInput} onChange={setSearchInput} placeholder="Name, email or phone" />
        </form>
      </Toolbar>

      {loading ? (
        <LoadingBlock label="Loading people…" />
      ) : users.length === 0 ? (
        <EmptyBlock
          icon={<Users className="h-7 w-7" aria-hidden />}
          title="No one here"
          body={
            search
              ? `No one matches “${search}”. Try a name, email or phone number.`
              : roleFilter
                ? `No ${filterLabel.toLowerCase()} yet.`
                : "People show up here when they sign up."
          }
          action={
            search ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
              >
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="mb-2 px-1 text-[14px] tabular-nums text-label-2">{countLabel(total, roleFilter)}</p>

          {/* Desktop */}
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Person</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Account</th>
                <th className={`${thClass} text-right`}>Orders</th>
                <th className={`${thClass} text-right`}>Shops</th>
                <th className={thClass}>Joined</th>
                <th className={thClass}>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={`${trClass} cursor-pointer`} onClick={() => setSelectedId(user.id)}>
                  <td className={tdClass}>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.fullName} />
                      <div className="min-w-0">
                        <p className="font-semibold text-label">{user.fullName}</p>
                        <p className="text-[13px] text-label-2">{contact(user)}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <StatusPill status={user.role} />
                  </td>
                  <td className={tdClass}>
                    <AccountPill active={user.isActive} />
                  </td>
                  <td className={`${tdClass} text-right tabular-nums text-label-2`}>{user._count.orders}</td>
                  <td className={`${tdClass} text-right tabular-nums text-label-2`}>{user._count.vendors}</td>
                  <td className={`${tdClass} whitespace-nowrap text-label-2`}>{formatDateIST(user.createdAt)}</td>
                  <td className={`${tdClass} text-right`}>
                    <span className="inline-flex items-center gap-0.5 text-[15px] font-medium text-tint">
                      Manage <ChevronRight className="h-4 w-4" aria-hidden />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>

          {/* Phone */}
          <List className="md:hidden">
            {users.map((user) => (
              <Row
                key={user.id}
                onClick={() => setSelectedId(user.id)}
                leading={<Avatar name={user.fullName} />}
                title={<span className="font-semibold">{user.fullName}</span>}
                subtitle={
                  <>
                    <span className="block truncate">{contact(user)}</span>
                    <span className="block">
                      Joined {formatDateIST(user.createdAt)}
                      {!user.isActive && <span className="font-medium text-bad"> · Blocked</span>}
                    </span>
                  </>
                }
                trailing={<StatusPill status={user.role} />}
              />
            ))}
          </List>

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}

      {/* ── Person ── */}
      <Sheet
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.fullName}
        description={selected ? `Joined ${formatDateIST(selected.createdAt)}` : undefined}
        footer={
          selected &&
          (selected.isActive ? (
            <Button
              variant="secondary"
              full
              className="text-bad!"
              onClick={() => handleToggleActive(selected.id, true)}
              loading={updatingId === selected.id}
            >
              Block this account
            </Button>
          ) : (
            <Button full onClick={() => handleToggleActive(selected.id, false)} loading={updatingId === selected.id}>
              Unblock account
            </Button>
          ))
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={selected.role} />
              <AccountPill active={selected.isActive} />
            </div>

            <DetailGrid>
              <Detail label="Email">{selected.email || <span className="text-label-3">Not given</span>}</Detail>
              <Detail label="Phone">
                {selected.phone ? (
                  <a href={`tel:${selected.phone}`} className="text-tint">
                    {selected.phone}
                  </a>
                ) : (
                  <span className="text-label-3">Not given</span>
                )}
              </Detail>
              <Detail label="Orders placed">
                <span className="tabular-nums">{selected._count.orders}</span>
              </Detail>
              <Detail label="Shops">
                <span className="tabular-nums">{selected._count.vendors}</span>
              </Detail>
            </DetailGrid>

            <section>
              <SectionHeader title="Role" />
              <div className="rounded-2xl bg-card p-4">
                {selected.role === "ADMIN" ? (
                  // Admin accounts are managed on the server only
                  <p className="text-[15px] leading-snug text-label-2">
                    <span className="font-semibold text-label">Admin.</span> {ROLE_NOW.ADMIN} This can&apos;t be
                    changed from here.
                  </p>
                ) : (
                  <>
                    <div className={updatingId === selected.id ? "pointer-events-none opacity-50" : undefined}>
                      <Segmented
                        label="Role"
                        options={ROLE_OPTIONS}
                        value={selected.role}
                        onChange={(v) => handleRoleChange(selected.id, v)}
                      />
                    </div>
                    <p className="mt-3 text-[14px] leading-snug text-label-2">
                      {ROLE_NOW[selected.role] ?? "Pick what this person can do on LocalMart."}
                    </p>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
      </Sheet>
    </AdminPage>
  );
}
