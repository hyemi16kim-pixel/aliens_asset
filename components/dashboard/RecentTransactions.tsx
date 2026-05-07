"use client";

import Link from "next/link";
import { theme } from "@/components/lib/theme";
import { useEffect, useState } from "react";
import {
  getOwnerColor,
  mapOwnerName,
} from "@/components/lib/profileSettings";

type Transaction = {
  id: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  category: string;
  owner?: string | null;
  memo?: string | null;
};

export default function RecentTransactions({
  items = [],
}: {
  items?: Transaction[];
}) {

const iconEmojiMap: Record<string, string> = {
  식비: "🍽️",
  카페: "☕",
  쇼핑: "🛒",
  교통: "🚌",
  생활: "🏠",
  데이트: "💗",
  게임: "🎮",
  영화: "🎬",
  선물: "🎁",
  병원: "🏥",
  공부: "📚",
  운동: "🏋️",
  여행: "✈️",
  의류: "👕",
  통신: "📱",
  반려: "🐾",
  육아: "👶",
  음악: "🎵",
  급여: "💼",
  보너스: "🎁",
  용돈: "👛",
  이자: "🏦",
  배당: "🐷",
  환급: "⬇️",
  이체: "🔁",
  자동이체: "🔁",
  카드대금: "💳",
  저축이동: "🐷",
  은행: "🏦",
  주식: "📈",
  매수: "📈",
  매도: "📉",
};

const getIcon = (tx: Transaction) => {
  if (tx.category.includes("주식 매수")) return "📈";
  if (tx.category.includes("주식 매도")) return "📉";

  const savedKeys = ["EXPENSE", "INCOME", "TRANSFER"];

  for (const key of savedKeys) {
    const saved = localStorage.getItem(`alien_custom_categories_${key}`);
    const list = saved ? JSON.parse(saved) : [];
    const found = list.find((item: any) => item.name === tx.category);

    if (found) {
      return iconEmojiMap[found.iconKey] || "👽";
    }
  }

  return iconEmojiMap[tx.category] || "👽";
};

  const formatAmount = (tx: Transaction) => {
    const sign =
      tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : "";
    return `${sign}₩${Math.abs(Number(tx.amount)).toLocaleString()}`;
  };

  return (
    <section
      style={{
        background: "white",
        borderRadius: 22,
        padding: "16px",
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 14 }}>최근 거래내역</strong>
        <Link
          href="/transactions"
          style={{
            fontSize: 11,
            color: theme.colors.primary,
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          전체 보기
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: theme.colors.subtext,
          }}
        >
          아직 거래가 없습니다.
        </div>
) : (
  <div style={scrollListStyle}>
{items
  .slice()
  .sort((a, b) => b.id - a.id)
  .slice(0, 20)
  .map((tx) => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                minWidth: 0,
                flex: 1,
              }}
            >
  <span style={{ width: 16, textAlign: "center" }}>{getIcon(tx)}</span>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "68px 60px minmax(0, 1fr)",
      alignItems: "center",
      gap: 4,
      minWidth: 0,
    }}
  >
    <div style={ownerNameRowStyle}>
      <span
        style={{
          ...ownerDotStyle,
          background: getOwnerColor(tx.owner),
        }}
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: theme.colors.text,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",     
        }}
      >
        {mapOwnerName(tx.owner)}
      </span>
    </div>

    <span
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: theme.colors.text,
        whiteSpace: "nowrap",
      }}
    >
      {tx.category}
    </span>

    {tx.memo && (
      <span
        style={{
          fontSize: 11,
          color: theme.colors.subtext,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {tx.memo}
      </span>
    )}
  </div>
</div>

            <strong
              style={{
                 flexShrink: 0,
                 marginLeft: 8,
                color:
                tx.type === "INCOME"
                  ? theme.colors.income
                  : tx.type === "EXPENSE"
                  ? theme.colors.expense
                  : theme.colors.primary,
              }}
            >
              {formatAmount(tx)}
            </strong>
          </div>
        ))}
  </div>
      )}
    </section>
  );
}

const scrollListStyle = {
  height: 150,
  maxHeight: 190,
  overflowY: "scroll",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  touchAction: "pan-y",
  paddingRight: 4,
} as const;


const ownerNameRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  minWidth: 0,
} as const;

const ownerDotStyle = {
  width: 8,
  height: 8,
  borderRadius: 999,
  flexShrink: 0,
} as const;