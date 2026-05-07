"use client";

import { useEffect, useState } from "react";
import { theme } from "@/components/lib/theme";

type Holding = {
  id: number;
  name: string;
  code: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  purchaseAmount: number;
  profitAmount: number;
  profitRate: number;
};

type Props = {
  accountId: number;
  accountName: string;
  ownerName: string;
  onChanged: () => void;
};

const money = (v: number) => `${Math.round(v).toLocaleString("ko-KR")}원`;

export default function StockHoldingList({
  accountId,
  accountName,
  ownerName,
  onChanged,
}: Props) {
  const [items, setItems] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<Holding | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [avgPrice, setAvgPrice] = useState("");

  const loadStocks = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/stocks?accountId=${accountId}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      await onChanged(); // ← 여기 추가
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
  }, [accountId]);

  const total = items.reduce((sum, item) => sum + item.marketValue, 0);
    const realOwnerName =
    ownerName === "나"
        ? localStorage.getItem("alien_my_name") || "나"
        : ownerName === "파트너"
        ? localStorage.getItem("alien_partner_name") || "파트너"
        : ownerName;
        

const saveEditStock = async () => {
  if (!editingItem) return;

  const res = await fetch("/api/stocks", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: editingItem.id,
      quantity: Number(quantity),
      avgPrice: Number(avgPrice),
    }),
  });

  const data = await res.json().catch(() => null);

    if (!res.ok) {
        alert(data?.error || "보유종목 수정 실패");
        return;
    }

    setEditingItem(null);
    setQuantity("");
    setAvgPrice("");
    await loadStocks();
    };

  const saveStock = async () => {
    const res = await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        name,
        code,
        quantity: Number(quantity),
        avgPrice: Number(avgPrice),
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.error || "종목 저장 실패");
      return;
    }

    setShowAdd(false);
    setName("");
    setCode("");
    setQuantity("");
    setAvgPrice("");
    await loadStocks();
  };

  return (
    <section style={wrapStyle}>
      <div style={headerStyle}>
        <div>
          <strong style={{ fontSize: 15 }}>상세 목록</strong>
          <div style={subTextStyle}>
            {accountName} {realOwnerName} 보유 종목
          </div>
        </div>

                <div
                style={{
                    textAlign: "right",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
                >
            
          <strong>{money(total)}</strong>
            <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={addButtonStyle}
            >
            + 종목 추가
          </button>
        </div>
      </div>

      <div style={graphWrapStyle}>
        {items.map((item) => {
          const width = total > 0 ? (item.marketValue / total) * 100 : 0;

          return (
            <div
              key={item.id}
              style={{
                width: `${width}%`,
                height: 12,
                background: theme.colors.primary,
                opacity: 0.35 + width / 200,
              }}
            />
          );
        })}
      </div>

      {loading && <p style={emptyStyle}>불러오는 중...</p>}

      {!loading && items.length === 0 && (
        <p style={emptyStyle}>아직 등록된 보유종목이 없습니다.</p>
      )}

      <div style={listStyle}>
        {items.map((item) => (
            <div
            key={item.id}
            style={cardStyle}
            onDoubleClick={() => {
                setEditingItem(item);
                setQuantity(String(item.quantity));
                setAvgPrice(String(item.avgPrice));
            }}
            >
            <div>
              <strong style={{ fontSize: 13 }}>
                {item.name}({item.code})
              </strong>
              <div style={subTextStyle}>
                {item.quantity}주 · 평균 {money(item.avgPrice)}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <strong>{money(item.marketValue)}</strong>
              <div
                style={{
                  fontSize: 11,
                  color: item.profitAmount >= 0 ? "#E11D48" : "#2563EB",
                  fontWeight: 800,
                  marginTop: 4,
                }}
              >
                {item.profitAmount >= 0 ? "+" : ""}
                {money(item.profitAmount)} · {item.profitRate.toFixed(1)}%
              </div>
              <div style={subTextStyle}>현재가 {money(item.currentPrice)}</div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <strong>보유종목 추가</strong>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="종목명 예: 삼성전자"
              style={inputStyle}
            />

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="종목코드 예: 005930"
              style={inputStyle}
            />

            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="수량"
              type="number"
              style={inputStyle}
            />

            <input
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              placeholder="평균단가"
              type="number"
              style={inputStyle}
            />

            <button onClick={saveStock} style={saveButtonStyle}>
              저장하기
            </button>

            <button onClick={() => setShowAdd(false)} style={cancelButtonStyle}>
              닫기
            </button>
          </div>
        </div>
      )}

      {editingItem && (
        <div style={modalOverlayStyle}>
            <div style={modalStyle}>
            <strong>보유종목 수정</strong>

            <div style={subTextStyle}>
                {editingItem.name}({editingItem.code})
            </div>

                <label style={labelStyle}>보유 수량</label>
                <input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="예: 10"
                type="number"
                style={inputStyle}
                />

                <label style={labelStyle}>평균 단가</label>
                <input
                value={avgPrice}
                onChange={(e) => setAvgPrice(e.target.value)}
                placeholder="예: 70000"
                type="number"
                style={inputStyle}
                />

            <button onClick={saveEditStock} style={saveButtonStyle}>
                저장하기
            </button>

            <button
                onClick={() => {
                setEditingItem(null);
                setQuantity("");
                setAvgPrice("");
                }}
                style={cancelButtonStyle}
            >
                닫기
            </button>
            </div>
        </div>
        )}
    </section>
  );
}

const wrapStyle = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: `1px solid ${theme.colors.border}`,
  display: "flex",
  flexDirection: "column",
  gap: 12,
} as const;

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
} as const;

const graphWrapStyle = {
  height: 12,
  borderRadius: 999,
  background: "#F1ECFF",
  overflow: "hidden",
  display: "flex",
} as const;

const listStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
} as const;

const cardStyle = {
  minHeight: 66,
  borderBottom: `1px solid ${theme.colors.border}`,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "8px 0 12px",
} as const;

const subTextStyle = {
  fontSize: 11,
  color: theme.colors.subtext,
  marginTop: 4,
} as const;

const emptyStyle = {
  fontSize: 12,
  color: theme.colors.subtext,
  margin: "8px 0",
} as const;

const addButtonStyle = {
  marginTop: 0,
  height: 20,
  display: "flex",
  alignItems: "center",
  border: "none",
  background: "transparent",
  color: theme.colors.primary,
  fontSize: 11,
  fontWeight: 900,
  cursor: "pointer",
} as const;

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.28)",
  display: "flex",
  alignItems: "end",
  justifyContent: "center",
  zIndex: 80,
} as const;

const modalStyle = {
  width: "100%",
  maxWidth: 390,
  background: "white",
  borderRadius: "26px 26px 0 0",
  padding: "22px 18px 28px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
} as const;

const inputStyle = {
  height: 44,
  borderRadius: 14,
  border: `1px solid ${theme.colors.border}`,
  padding: "0 12px",
  fontSize: 14,
} as const;

const saveButtonStyle = {
  height: 46,
  border: "none",
  borderRadius: 16,
  background: theme.colors.primary,
  color: "white",
  fontWeight: 800,
  fontSize: 14,
} as const;

const cancelButtonStyle = {
  height: 42,
  border: "none",
  background: "transparent",
  color: theme.colors.subtext,
  fontWeight: 700,
} as const;

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  marginTop: 6,
  marginBottom: -4,
} as const;