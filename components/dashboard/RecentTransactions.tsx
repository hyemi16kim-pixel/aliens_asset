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
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 4, height: 18, borderRadius: 999, background: "linear-gradient(180deg, #7C5CFF, #A78BFA)" }} />
          <strong style={{ fontSize: 15, fontWeight: 900, color: theme.colors.text }}>최근 거래내역</strong>
        </div>
        <Link
          href="/transactions?view=all"
          style={{ fontSize: 11, color: theme.colors.primary, textDecoration: "none", fontWeight: 800 }}
        >
          전체 보기 →
        </Link>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0", color: theme.colors.subtext }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>👽</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>아직 거래가 없습니다</div>
        </div>
) : (
  <div style={scrollListStyle}>
{items
  .slice()
  .sort((a, b) => b.id - a.id)
  .slice(0, 20)
  .map((tx, idx, arr) => (
          <div
            key={tx.id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 2px",
              fontSize: 13,
              borderBottom: idx < arr.length - 1 ? "1.5px dashed #EDE6F9" : "none",
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
  <div style={{
    width: 36, height: 36, borderRadius: 12, flexShrink: 0,
    background: tx.type === "INCOME" ? "#ECFFF6" : tx.type === "EXPENSE" ? "#FFF3F6" : "#F4EFFE",
    display: "grid", placeItems: "center", fontSize: 17,
    border: tx.type === "INCOME" ? "1.5px solid #A7F3D0" : tx.type === "EXPENSE" ? "1.5px solid #FFCCD8" : "1.5px solid #DDD6FE",
  }}>{getIcon(tx)}</div>

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
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "-0.3px",
                color:
                  tx.type === "INCOME"
                    ? "#059669"
                    : tx.type === "EXPENSE"
                    ? "#FF3B70"
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
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  touchAction: "pan-y",
} as const;


const ownerNameRowStyle = {
  display: "flex",
  alignItems: "center",
