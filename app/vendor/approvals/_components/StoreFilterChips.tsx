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
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex items-center gap-2 pb-2">
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
      className={`flex-shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
        active
          ? 'bg-accent text-white border-accent'
          : 'bg-white text-ink-2 border-sand hover:border-ink-3'
      }`}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          className={`inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold ${
            active ? 'bg-white/25 text-white' : 'bg-laal/10 text-laal'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
