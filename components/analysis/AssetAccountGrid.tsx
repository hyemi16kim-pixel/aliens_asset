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
  ownerId?: number | null;
  owner?: {
    id: number;
    name: string;
  } | null;
};

function SortableCard({
  account,
  onEdit,
  onPalette,
  onSelectStockAccount,
}: {
  account: Account;
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

  const endPress = () => {
    clearPressTimer();
  };

  const handleCardClick = () => {
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }

    if (account.type === "STOCK") {
      onSelectStockAccount();
    }
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
      }}
    >
      <AssetAccountCard
        account={account}
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
          position: "absolute",
          right: 10,
          bottom: 10,
          width: 24,
          height: 24,
          border: "none",
          borderRadius: 999,
          background: "rgba(255,255,255,0.55)",
          cursor: "grab",
          fontSize: 13,
          fontWeight: 900,
          color: "#8E8AA5",
          touchAction: "none",
        }}
        title="드래그"
      >
        ⋮⋮
      </button>
    </div>
  );
}

export default function AssetAccountGrid({
  accounts,
  onEdit,
  onPalette,
  onSelectStockAccount,
}: {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onPalette: (account: Account) => void;
  onSelectStockAccount: (account: Account) => void;
}) {
  const [items, setItems] = useState(accounts);

  useEffect(() => {
    setItems(accounts);
  }, [accounts]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const nextItems = arrayMove(items, oldIndex, newIndex);
    setItems(nextItems);

    await fetch("/api/accounts/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountIds: nextItems.map((item) => item.id),
      }),
    });
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {items.map((account) => (
            <SortableCard
              key={account.id}
              account={account}
              onEdit={() => onEdit(account)}
              onPalette={() => onPalette(account)}
              onSelectStockAccount={() => onSelectStockAccount(account)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}