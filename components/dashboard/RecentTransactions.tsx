"use client";

import Link from "next/link";
import { theme } from "@/components/lib/theme";
import { useEffect, useState } from "react";
import {
  getOwnerColor,
  mapOwnerName,
} from "@/components/lib/profileSettings";
import { getCurrentFamilyId } from "@/components/lib/familyCode";

type Transaction = {
  id: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  category: string;
  owner?: string | null;
  memo?: string | null;
};

const englishIconMap: Record<string, string> = {
  home: "🏠", utensils: "🍽️", coffee: "☕", shopping: "🛒",
  bus: "🚌", heart: "💗", gamepad: "🎮", film: "🎬", gift: "🎁",
  hospital: "🏥", book: "📚", dumbbell: "🏋️", plane: "✈️",
  shirt: "👕", phone: "📱", paw: "🐾", baby: "👶", music: "🎵",
  briefcase: "💼", building: "🏢", trending: "📈", card: "💳",
  refresh: "🔁", zap: "⚡", coins: "🪙", pencil: "✏️",
  handcoins: "🤲", trophy: "🏆", banknote: "💵", store: "🏪",
  wallet: "👛", landmark: "🏦", piggybank: "🐷", shoppingcart: "🛒",
};

export default function RecentTransactions({
  items = [],
}: {
  items?: Transaction[];
}) {
  const [dbIconMap, setDbIconMap] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const familyId = getCurrentFamilyId();
      if (!familyId) return;
      Promise.all([
        fetch(`/api/categories?familyId=${familyId}&type=EXPENSE`).then(r => r.json()),
        fetch(`/api/categories?familyId=${familyId}&type=INCOME`).then(r => r.json()),
      ]).then(([exp, inc]) => {
        const all = [...(Array.isArray(exp) ? exp : []), ...(Array.isArray(inc) ? inc : [])];
        const map: Record<string, string> = {};
        all.forEach((cat: any) => { if (cat.name && cat.icon) map[cat.name] = cat.icon; });
        setDbIconMap(map);
      }).catch(() => {});
    } catch {}
  }, []);

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
  const cat = tx.category || "";
  if (cat.includes("주식 매수")) return "📈";
  if (cat.includes("주식 매도")) return "📉";
  // 1st: built-in emoji map (Korean category names)
  if (iconEmojiMap[cat]) return iconEmojiMap[cat];
  // 2nd: DB icon key (English) → emoji
  const dbKey = dbIconMap[cat];
  if (dbKey && englishIconMap[dbKey]) return englishIconMap[dbKey];
  // TRANSFER with no category
  if (tx.type === "TRANSFER") return "🔁";
  return "👽";
};

  const formatAmount = (tx: Transaction) => {
    const sign =
      tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : "";
    return `${sign}₩${Math.abs(Number(tx.amount)).toLocaleString()}`;
  };

  return (
    <section
      style={{
        background: theme.colors.card,
        borderRadius: 24,
        padding: "20px",
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadow.sm,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <strong style={{ fontSize: 15, fontWeight: 800, color: theme.colors.text }}>최근 거래내역</strong>
        <Link
          href="/transactions"
          style={{
            fontSize: 11,
            color: theme.colors.primary,
            textDecoration: "none",
            fontWeight: 800,
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = theme.colors.primaryDark)}
          onMouseLeave={(e) => (e.currentTarget.style.color = theme.colors.primary)}
        >
          전체 보기 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: theme.colors.subtext,
            padding: "20px",
            textAlign: "center",
            background: theme.colors.bgLight,
            borderRadius: 12,
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
              padding: "12px",
              fontSize: 13,
              borderRadius: 12,
              marginBottom: 6,
              background: theme.colors.bgLight,
              border: `1px solid ${theme.colors.border}`,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.colors.border;
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.bgLight;
              e.currentTarget.style.transform = "translateX(0)";
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
      {tx.category || (tx.type === "TRANSFER" ? "이체" : "기타")}
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
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  touchAction: "pan-y",
  paddingRight: 2,
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