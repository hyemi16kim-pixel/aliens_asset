"use client";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";
import AssetAccountCard from "./AssetAccountCard";

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  stockCash?: number | null;
  cardPaymentDay?: number | null;
  cardCycleStartDay?: number | null;
  cardCycleEndDay?: number | null;
  color?: string | null;
  nextPaymentDate?: string | null;
  nextPaymentAmount?: number | null;
  nextMonthAmount?: number | null;
  maturityDate?: string | null;
  monthlyPayment?: number | null;
  displayOrder?: number;
  sourceKey?: string | null;
  ownerId?: number | null;
  owner?: { id: number; name: string } | null;
};

const ASSET_TYPES = ["BANK", "SAVING", "CASH"];
const INVEST_TYPES = ["STOCK"];
const DEBT_TYPES = ["CARD", "LOAN"];

const money = (v: number) =>
  `${Math.round(Math.abs(v)).toLocaleString("ko-KR")}`;

function SortableCard({
  account,
  users,
  onEdit,
  onPalette,
  onSelectStockAccount,
}: {
  account: Account;
  users: { id: number; name: string; role?: string }[];
  onEdit: () => void;
  onPalette: () => void;
  onSelectStockAccount: () => void;
}) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressedRef = useRef(false);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: account.id });

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const startLongPress = () => {
    longPressedRef.current = false;
    clearPressTimer();
    pressTimerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      onEdit();
    }, 600);
  };

  const endPress = () => { clearPressTimer(); };

  const handleCardClick = () => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    if (account.type === "STOCK") onSelectStockAccount();
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onMouseDown={startLongPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startLongPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      style={{
        position: "relative",
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "manipulation",
        height: "100%",
      }}
    >
      <AssetAccountCard
        account={account}
        users={users}
        onClick={handleCardClick}
        onDoubleClick={onEdit}
        onPalette={onPalette}
        onDetail={() => {
          window.location.href = `/transactions?accountId=${account.id}`;
        }}
      />
      <button
        type="button"
        {...listeners}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute", right: 10, bottom: 10,
          width: 24, height: 24, border: "none", borderRadius: 999,
          background: "rgba(255,255,255,0.55)", cursor: "grab",
          fontSize: 13, fontWeight: 900, color: "#8E8AA5",
          touchAction: "none",
        }}
        title="drag"
      >
        {"⋮⋮"}
      </button>
    </div>
  );
}

function SectionGroup({
  label,
  badge,
  total,
  isDebt,
  accounts,
  users,
  onEdit,
  onPalette,
  onSelectStockAccount,
  onDragEnd,
}: {
  label: string;
  badge: { bg: string; color: string };
  total: number;
  isDebt?: boolean;
  accounts: Account[];
  users: { id: number; name: string; role?: string }[];
  onEdit: (account: Account) => void;
  onPalette: (account: Account) => void;
  onSelectStockAccount: (account: Account) => void;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  if (accounts.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: "3px 10px", borderRadius: 999,
          background: badge.bg, color: badge.color,
        }}>
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: isDebt ? "#E11D48" : "#2D2545" }}>
          {isDebt ? "-" : ""}{money(total)}{"원"}
        </span>
      </div>

      <div style={{ height: 1, background: badge.bg, marginBottom: 10, borderRadius: 1 }} />

      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={accounts.map((a) => a.id)} strategy={rectSortingStrategy}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
            {accounts.map((account) => (
              <SortableCard
                key={account.id}
                account={account}
                users={users}
                onEdit={() => onEdit(account)}
                onPalette={() => onPalette(account)}
                onSelectStockAccount={() => onSelectStockAccount(account)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default function AssetAccountGrid({
  accounts,
  users = [],
  onEdit,
  onPalette,
  onSelectStockAccount,
  stockMarketValues = {},
}: {
  accounts: Account[];
  users?: { id: number; name: string; role?: string }[];
  onEdit: (account: Account) => void;
  onPalette: (account: Account) => void;
  onSelectStockAccount: (account: Account) => void;
  stockMarketValues?: Record<number, number>;
}) {
  const [items, setItems] = useState(accounts);

  useEffect(() => { setItems(accounts); }, [accounts]);

  const assetAccounts = items.filter((a) => ASSET_TYPES.includes(a.type));
  const investAccounts = items.filter((a) => INVEST_TYPES.includes(a.type));
  const debtAccounts = items.filter((a) => DEBT_TYPES.includes(a.type));

  const assetTotal = assetAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  // 현 평가액 = 주식 평가 + 예수금 (stockMarketValues에서 우선, 없으면 fallback)
  const investTotal = investAccounts.reduce(
    (sum, a) => sum + (stockMarketValues[a.id] ?? Number(a.stockCash || a.balance || 0)),
    0
  );
  const isAfterPaymentDay = (cardPaymentDay?: number | null) => {
    if (!cardPaymentDay) return false;
    return new Date().getDate() >= cardPaymentDay;
  };
  const debtTotal = debtAccounts.reduce((sum, a) => {
    if (a.type === "CARD") {
      const showNext = isAfterPaymentDay(a.cardPaymentDay);
      return sum + Math.abs(Number(showNext ? (a.nextMonthAmount || 0) : (a.nextPaymentAmount || 0)));
    }
    if (a.type === "LOAN") return sum + Math.abs(Number(a.balance || 0));
    return sum;
  }, 0);

  const makeHandler = (sectionItems: Account[]) => async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const nextItems = arrayMove(items, oldIndex, newIndex);
    setItems(nextItems);

    await fetch("/api/accounts/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountIds: nextItems.map((item) => item.id) }),
    });
  };

  return (
    <div>
      <SectionGroup
        label={"자산"}
        badge={{ bg: "#EAF3DE", color: "#27500A" }}
        total={assetTotal}
        accounts={assetAccounts}
        users={users}
        onEdit={onEdit}
        onPalette={onPalette}
        onSelectStockAccount={onSelectStockAccount}
        onDragEnd={makeHandler(assetAccounts)}
      />
      <SectionGroup
        label={"투자"}
        badge={{ bg: "#E6F1FB", color: "#0C447C" }}
        total={investTotal}
        accounts={investAccounts}
        users={users}
        onEdit={onEdit}
        onPalette={onPalette}
        onSelectStockAccount={onSelectStockAccount}
        onDragEnd={makeHandler(investAccounts)}
      />
      <SectionGroup
        label={"부채"}
        badge={{ bg: "#FCEBEB", color: "#791F1F" }}
        total={debtTotal}
        isDebt
        accounts={debtAccounts}
        users={users}
        onEdit={onEdit}
        onPalette={onPalette}
        onSelectStockAccount={onSelectStockAccount}
        onDragEnd={makeHandler(debtAccounts)}
      />
    </div>
  );
}
