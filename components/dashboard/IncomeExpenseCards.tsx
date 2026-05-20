"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function IncomeExpenseCards({ data = {} }: { data?: any }) {
  const income = data?.totalIncome || 0;
  const expense = data?.totalExpense || 0;
  const total = income - expense;
  const [rangeText, setRangeText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("alien_date_range") || "";
    setRangeText(saved);
  }, []);

  const money = (v: number) => `₩${Number(v || 0).toLocaleString()}`;

  return (
    <section style={{
      background: "white",
      borderRadius: 24,
      border: "1px solid #EDE6F9",
      boxShadow: "0 6px 24px rgba(167,139,250,0.10)",
      padding: "18px 18px 16px",
    }}>
      {/* 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#2D2545" }}>이번 달 요약</span>
        {rangeText && (
          <span style={{ fontSize: 11, color: "#C4B8D8", fontWeight: 600 }}>{rangeText}</span>
        )}
      </div>

      {/* 수입 / 지출 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{
          background: "linear-gradient(160deg, #ECFFF6 0%, #E0FFF2 100%)",
          borderRadius: 18, border: "1.5px solid #A7F3D0",
          padding: "14px 16px",
          boxShadow: "0 4px 12px rgba(16,185,129,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "grid", placeItems: "center" }}>
              <TrendingUp size={13} color="#10B981" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981" }}>수입</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#059669", letterSpacing: "-0.5px" }}>
            {money(income)}
          </div>
        </div>

        <div style={{
          background: "linear-gradient(160deg, #FFF3F6 0%, #FFE8EE 100%)",
          borderRadius: 18, border: "1.5px solid #FFCCD8",
          padding: "14px 16px",
          boxShadow: "0 4px 12px rgba(255,107,129,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(255,107,129,0.15)", display: "grid", placeItems: "center" }}>
              <TrendingDown size={13} color="#FF6B81" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#FF6B81" }}>지출</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#FF3B70", letterSpacing: "-0.5px" }}>
            {money(expense)}
          </div>
        </div>
      </div>

      {/* 합계 */}
      <div style={{
        background: total >= 0
          ? "linear-gradient(160deg, #F4EFFE 0%, #EDE6FC 100%)"
          : "linear-gradient(160deg, #FFF3F6 0%, #FFE8EE 100%)",
        borderRadius: 16,
        border: `1.5px solid ${total >= 0 ? "#DDD6FE" : "#FFCCD8"}`,
        padding: "12px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Minus size={13} color="#B0A8C8" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#B0A8C8" }}>이번 달 합계</span>
        </div>
        <strong style={{
          fontSize: 15, fontWeight: 900,
          color: total >= 0 ? "#7C5CFF" : "#FF3B70",
        }}>
          {total >= 0 ? "+" : "-"}{money(Math.abs(total))}
        </strong>
      </div>
    </section>
  );
}
