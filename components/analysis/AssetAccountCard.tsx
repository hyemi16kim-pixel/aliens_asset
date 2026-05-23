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
  owner?: { id: number; name: string } | null;
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
  users?: { id: number; name: string; role?: string }[];
  onClick: () => void;
  onDoubleClick: () => void;
  onPalette: () => void;
  onDetail: () => void;
};

const iconMap: Record<string, string> = {
  BANK: "🏦", STOCK: "📈", CARD: "💳", SAVING: "🐷", CASH: "💵", LOAN: "⚠️",
};

const money = (v: number) => `${Math.round(v).toLocaleString("ko-KR")}원`;

const getCardPaymentLabel = (monthOffset: number, day?: number | null) => {
  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, day || 1);
  return `${String(target.getMonth() + 1).padStart(2, "0")}/${String(target.getDate()).padStart(2, "0")}`;
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

export default function AssetAccountCard({ account, users = [], onClick, onDoubleClick, onPalette, onDetail }: Props) {
  const iconColor = paletteColorMap[account.color || "#F6F0FF"] || "#7C5CFF";

  const [stockLoading, setStockLoading] = useState(account.type === "STOCK");
  const [stockSummary, setStockSummary] = useState<{
    stockCash: number;
    currentStockValue: number;
    totalValue: number;
    totalDividend: number;
    purchaseCost: number;
    profitAmount: number;
    profitRate: number;
  } | null>(null);

  useEffect(() => {
    if (account.type !== "STOCK") return;
    setStockLoading(true);
    fetch(`/api/stocks/summary?accountId=${account.id}`)
      .then((res) => res.json())
      .then((data) => {
        setStockSummary({
          stockCash: Number(data.stockCash || 0),
          currentStockValue: Number(data.currentStockValue || 0),
          totalValue: Number(data.totalValue || 0),
          totalDividend: Number(data.totalDividend || 0),
          purchaseCost: Number(data.purchaseCost || 0),
          profitAmount: Number(data.profitAmount || 0),
          profitRate: Number(data.profitRate || 0),
        });
      })
      .catch(() => {
        // API 실패 시 stockCash만이라도 표시
        setStockSummary({
          stockCash: Number(account.stockCash || 0),
          currentStockValue: 0,
          totalValue: Number(account.stockCash || 0),
          totalDividend: 0,
          purchaseCost: 0,
          profitAmount: 0,
          profitRate: 0,
        });
      })
      .finally(() => setStockLoading(false));
  }, [account.id, account.type, account.balance, account.stockCash]);

  // 소유자 이름: owner.id 기준 조회 (기기 사용자 교체에 무관)
  const ownerName = (() => {
    if (!account.owner) return "공동";
    if (account.owner.id && users.length > 0) {
      const found = users.find((u) => u.id === account.owner!.id);
      if (found) return found.name;
    }
    return account.owner.name || "공동";
  })();

  const getRemainingPeriod = (date?: string | null) => {
    if (!date) return "-";
    const today = new Date();
    const target = new Date(date);
    if (target < today) return "만기 지남";
    let totalMonths = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
    let days = target.getDate() - today.getDate();
    if (days < 0) {
      totalMonths -= 1;
      days += new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    }
    return `${totalMonths}개월 ${days}일`;
  };


  return (
    <div
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{
        width: "100%", minHeight: 148, height: "100%",
        border: "1px solid #E9DDFE",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        overflow: "hidden", borderRadius: 22,
        background: account.color || "#F6F0FF",
        padding: "14px 12px", textAlign: "left",
        boxShadow: "0 8px 20px rgba(167,139,250,0.12)", cursor: "pointer",
      }}
    >
      {/* 상단: 소유자 pill + 버튼 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={ownerPillStyle}>{ownerName}</span>
        <div style={{ display: "flex", flexDirection: "row", gap: 6, alignItems: "center" }}>
          <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDetail(); }} style={iconButtonStyle}>
            <ListFilter size={14} color={iconColor} />
          </button>
          <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onPalette(); }} style={iconButtonStyle}>
            <Palette size={14} color={iconColor} />
          </button>
        </div>
      </div>

      {/* 아이콘 + 계좌명 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{iconMap[account.type] || "🛸"}</span>
        <strong style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {account.name}
        </strong>
      </div>

      {/* 메인 금액 */}
      <div style={{ fontSize: 17, fontWeight: 800 }}>
        {account.type === "STOCK"
          ? (stockLoading ? "로딩 중..." : money(stockSummary?.totalValue || 0))
          : account.type === "CARD"
          ? money(-(account.nextPaymentAmount || 0))
          : account.type === "LOAN"
          ? money(account.balance === 0 ? 0 : -Math.abs(account.balance))
          : money(account.balance)}
      </div>

      {/* 하단 상세 */}
      <div style={{ marginTop: 8, fontSize: 11, color: "#6F5C86", lineHeight: 1.5 }}>
        {account.type === "CARD" && (
          <>
            <div>{getCardPaymentLabel(0, account.cardPaymentDay)} 예상납부 {money(-(account.nextPaymentAmount || 0))}</div>
            <div>{getCardPaymentLabel(1, account.cardPaymentDay)} 예상납부 {money(-(account.nextMonthAmount || 0))}</div>
          </>
        )}

        {account.type === "LOAN" && (
          <>
            <div>월 납부 {money(account.monthlyPayment || 0)}</div>
            <div>만기까지 {getRemainingPeriod(account.maturityDate)}</div>
          </>
        )}

        {account.type === "SAVING" && account.maturityDate && (
          <div>만기일 ~{account.maturityDate.slice(0, 10)}</div>
        )}

        {account.type === "STOCK" && (
          <>
            <div>예수금 {money(stockSummary?.stockCash || 0)}</div>
            <div>주식 {money(stockSummary?.currentStockValue || 0)}</div>
            <div style={{ color: (stockSummary?.profitAmount || 0) >= 0 ? "#10B981" : "#E11D48", fontWeight: 900 }}>
              총평가 {(stockSummary?.profitAmount || 0) >= 0 ? "+" : ""}{money(stockSummary?.profitAmount || 0)}{" "}
              <span style={{ fontSize: 10 }}>
                ({(stockSummary?.profitRate || 0) >= 0 ? "+" : ""}{(stockSummary?.profitRate || 0).toFixed(1)}%)
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const iconButtonStyle = {
  border: "none", background: "transparent", padding: 0,
  cursor: "pointer", display: "grid", placeItems: "center",
} as const;

const titleRowStyle = {
  display: "flex", alignItems: "center", gap: 4,
  minWidth: 0, overflow: "hidden", flex: 1,
} as const;

const ownerPillStyle = {
  fontSize: 10, color: "#8E8AA5", fontWeight: 700,
  background: "rgba(255,255,255,0.65)",
  border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 999,
  padding: "2px 8p