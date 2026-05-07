"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { theme } from "@/components/lib/theme";

export default function HeaderCard({ data = {} }: { data?: any }) {
  const [includeDebt, setIncludeDebt] = useState(true);

  const totalAsset = data?.totalAsset || 0;
  const debtAmount = data?.debtAmount || 0;

  const displayAsset = includeDebt ? totalAsset : totalAsset + Math.abs(debtAmount);

  const monthlyChange = (data?.totalIncome || 0) - (data?.totalExpense || 0);
  const money = (v: number) => `₩${Number(v || 0).toLocaleString()}`;

  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, #A992FF 100%)`,
        color: "white",
        borderRadius: 22,
        padding: "16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 22px rgba(143,124,255,0.22)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.88 }}>
            총 공동 자산 {includeDebt ? "· 부채 포함" : "· 부채 제외"}
          </div>

          <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px" }}>
            {money(displayAsset)}
          </div>

          <div style={{ marginTop: 6, fontSize: 11, opacity: 0.9 }}>
            이번 달 변동
          </div>

          <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700 }}>
            {monthlyChange >= 0 ? "+" : "-"}
            {money(Math.abs(monthlyChange))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>

          <button
            type="button"
            onClick={() => setIncludeDebt((prev) => !prev)}
            style={toggleButtonStyle}
          >
            <Sparkles size={15} />
          </button>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 14,
          bottom: 10,
          width: 58,
          height: 58,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.18)",
          display: "grid",
          placeItems: "center",
          border: "1px solid rgba(255,255,255,0.25)",
          fontSize: 28,
        }}
      >
        🛸
      </div>
    </section>
  );
}

const toggleButtonStyle = {
  border: "none",
  background: "rgba(255,255,255,0.16)",
  color: "white",
  width: 24,
  height: 24,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  padding: 0,
} as const;