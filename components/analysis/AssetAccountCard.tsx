// app/components/analysis/AssetAccountCard.tsx
"use client";

import { useEffect, useState } from "react";
import { ListFilter, Palette } from "lucide-react";

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  ownerId?: number | null;
  owner?: {
    id: number;
    name: string;
  } | null;
  stockCash?: number | null;
  cardPaymentDay?: number | null;
  cardCycleStartDay?: number | null;
  cardCycleEndDay?: number | null;
  color?: string | null;
  nextPaymentAmount?: number | null;
  nextMonthAmount?: number | null;
  maturityDate?: string | null;
  monthlyPayment?: number | null;
};

type Props = {
  account: Account;
  onClick: () => void;
  onDoubleClick: () => void;
  onPalette: () => void;
  onDetail: () => void;
};

const iconMap: Record<string, string> = {
  BANK: "🏦",
  STOCK: "📈",
  CARD: "💳",
  SAVING: "🐷",
  CASH: "💵",
  LOAN: "⚠️",
};

const money = (v: number) => `${Math.round(v).toLocaleString("ko-KR")}원`;

const getCardPaymentLabel = (monthOffset: number, day?: number | null) => {
  const today = new Date();
  const target = new Date(
    today.getFullYear(),
    today.getMonth() + monthOffset,
    day || 1
  );

  return `${String(target.getMonth() + 1).padStart(2, "0")}/${String(
    target.getDate()
  ).padStart(2, "0")}`;
};

const paletteColorMap: Record<string, string> = {
  "#F6F0FF": "#8B5CF6",
  "#FFE4F1": "#EC4899",
  "#E8F7FF": "#0EA5E9",
  "#FFF4D6": "#F59E0B",
  "#E8FFF3": "#10B981",
  "#F2F2F2": "#6B7280",
  "#A78BFA": "#6D28D9",
};

export default function AssetAccountCard({
  account,
  onClick,
  onDoubleClick,
  onPalette,
  onDetail,
}: Props) {
  const iconColor = paletteColorMap[account.color || "#F6F0FF"] || "#7C5CFF";

const [stockSummary, setStockSummary] = useState<{
  profitAmount: number;
  profitRate: number;
  currentStockValue: number;
  totalDividend: number;
  netDeposit: number;
  stockCash: number;
} | null>(null);

useEffect(() => {
  if (account.type !== "STOCK") return;

  fetch(`/api/stocks/summary?accountId=${account.id}`)
    .then((res) => res.json())
    .then((data) => {
      setStockSummary({
        profitAmount: Number(data.profitAmount || 0),
        profitRate: Number(data.profitRate || 0),
        currentStockValue: Number(data.currentStockValue || 0),
        totalDividend: Number(data.totalDividend || 0),
        netDeposit: Number(data.netDeposit || 0),
        stockCash: Number(data.stockCash || 0),
      });
    })
    .catch(console.error);
}, [account.id, account.type, account.balance, account.stockCash]);

  const myName =
    typeof window !== "undefined"
      ? localStorage.getItem("alien_my_name") || "나"
      : "나";

  const partnerName =
    typeof window !== "undefined"
      ? localStorage.getItem("alien_partner_name") || "파트너"
      : "파트너";

const getRemainingPeriod = (date?: string | null) => {
  if (!date) return "-";

  const today = new Date();
  const target = new Date(date);

  if (target < today) return "만기 지남";

  let year = target.getFullYear();
  let month = target.getMonth();
  let day = target.getDate();

  let tYear = today.getFullYear();
  let tMonth = today.getMonth();
  let tDay = today.getDate();

  let totalMonths = (year - tYear) * 12 + (month - tMonth);
  let days = day - tDay;

  if (days < 0) {
    totalMonths -= 1;

    const prevMonth = new Date(year, month, 0);
    days += prevMonth.getDate();
  }

  return `${totalMonths}개월 ${days}일`;
};

  const ownerName =
    account.owner?.name === "나"
      ? myName
      : account.owner?.name === "파트너"
      ? partnerName
      : account.owner?.name || "공동";
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        width: "100%",
        height: 150,
        minHeight: 150,
        border: "1px solid #E9DDFE",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        borderRadius: 22,
        background: account.color || "#F6F0FF",
        padding: "14px 12px",
        textAlign: "left",
        boxShadow: "0 8px 20px rgba(167, 139, 250, 0.12)",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <div style={titleRowStyle}>
          <strong style={{ fontSize: 13 }}>
            {iconMap[account.type] || "🛸"} {account.name}
          </strong>

          <span style={ownerInlineStyle}>{ownerName}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 6,
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDetail();
            }}
            style={iconButtonStyle}
          >
            <ListFilter size={15} color={iconColor} />
          </button>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onPalette();
            }}
            style={iconButtonStyle}
          >
            <Palette size={15} color={iconColor} />
          </button>
        </div>
      </div>

    <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800 }}>
      {account.type === "STOCK"
        ? money(
            (stockSummary?.stockCash || 0) +
              (stockSummary?.currentStockValue || 0)
          )
        : account.type === "CARD"
        ? money(-(account.nextPaymentAmount || 0))
        : account.type === "LOAN"
        ? money(-Math.abs(account.balance))
        : money(account.balance)}
    </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "#6F5C86",
          lineHeight: 1.5,
        }}
      >
        {account.type === "CARD" && (
          <>
            <div>
              {getCardPaymentLabel(0, account.cardPaymentDay)} 예상납부{" "}
              {money(-(account.nextPaymentAmount || 0))}
            </div>
            <div>
              {getCardPaymentLabel(1, account.cardPaymentDay)} 예상납부{" "}
              {money(-(account.nextMonthAmount || 0))}
            </div>
          </>
        )}

        {account.type === "LOAN" && (
          <>
            <div>월 납부 {money((account.monthlyPayment || 0))}</div>
            <div>만기까지 {getRemainingPeriod(account.maturityDate)}</div>
          </>
        )}

        {account.type === "SAVING" && account.maturityDate && (
          <div>만기일 ~{account.maturityDate.slice(0, 10)}</div>
        )}

{account.type === "STOCK" && (
  <>
    <div>
      예수금{" "}
      {money(
        (stockSummary?.stockCash || 0) +
          (stockSummary?.totalDividend || 0)
      )}
    </div>
    <div>주식 {money(stockSummary?.currentStockValue || 0)}</div>
    <div
  style={{
    color:
      (stockSummary?.profitAmount || 0) >= 0
        ? "#10B981"
        : "#E11D48",
    fontWeight: 900,
  }}
>
  총평가{" "}
  {(stockSummary?.profitAmount || 0) >= 0 ? "+" : ""}
  {money(stockSummary?.profitAmount || 0)} ·{" "}
  {(stockSummary?.profitRate || 0).toFixed(1)}%
</div>
  </>
)}
      </div>
    </div>
  );
}

const iconButtonStyle = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
} as const;

const ownerTextStyle = {
  marginTop: 3,
  fontSize: 10,
  color: "#8E8AA5",
  fontWeight: 700,
} as const;

const titleRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
} as const;

const ownerInlineStyle = {
  fontSize: 10,
  color: "#8E8AA5",
  fontWeight: 700,
} as const;

