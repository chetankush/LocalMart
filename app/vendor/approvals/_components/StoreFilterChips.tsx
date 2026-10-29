'use client';

import { useApprovals, type ApprovalStore } from '../../_approvals/ApprovalsPollerContext';

interface Props {
  selectedStoreId: string | null;
  onSelect: (storeId: string | null) => void;
}

export function StoreFilterChips({ selectedStoreId, onSelect }: Props) {
  const { stores, orders } = useApprovals();

  // Hide the row entirely for single-store vendors — zero clutter for them.
  if (stores.length <= 1) return null;

  const countFor = (storeId: string) =>
    orders.filter((o) => o.vendor.id === storeId).length;

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 scrollbar-hide">
      <div className="flex items-center gap-2">
        <Chip
          active={selectedStoreId === null}
          onClick={() => onSelect(null)}
          label="All"
          count={orders.length}
        />
        {stores.map((s: ApprovalStore) => (
          <Chip
            key={s.id}
            active={selectedStoreId === s.id}
            onClick={() => onSelect(s.id)}
            label={s.businessName}
            count={countFor(s.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[15px] transition-colors cursor-pointer ${
        active ? 'bg-label font-semibold text-white' : 'bg-card font-medium text-label-2 hover:text-label'
      }`}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[12px] font-bold ${
            active ? 'bg-white/20 text-white' : 'bg-tint text-white'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
