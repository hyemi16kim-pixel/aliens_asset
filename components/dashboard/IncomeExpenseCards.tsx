"use client";

import { useEffect, useState } from "react";
import { theme } from "@/components/lib/theme";

export default function IncomeExpenseCards({ data = {} }: { data?: any }) {
  const income = data?.totalIncome || 0;
  const expense = data?.totalExpense || 0;
  const [rangeText, setRangeText] = useState("");

  useEffect(() => {
    const saved =
      localStorage.getItem("alien_date_range") ||
      "26.05.01~26.06.01";
    setRangeText(saved);
  }, []);
  const money = (v: number) => `₩${Number(v || 0).toLocaleString()}`;
  const total = income - expense;

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        <span>이번 달 요약</span>
        <span style={{ color: theme.colors.subtext }}>실시간 DB</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
        }}
      >
        <MiniCard
          title="수입"
          amount={money(income)}
          color={theme.colors.income}
          bg="#F0FFF8"
        />

        <MiniCard
          title="지출"
          amount={money(expense)}
          color={theme.colors.expense}
          bg="#FFF3F6"
        />
      </div>

      <div
        style={{
          marginTop: 8,
          background: "white",
          borderRadius: 14,
          border: `1px solid ${theme.colors.border}`,
          padding: "10px 12px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        <span style={{ color: theme.colors.subtext }}>이번 달 합계</span>
        <strong>
          {total >= 0 ? "+" : "-"}
          {money(Math.abs(total))}
        </strong>
      </div>
    </section>
  );
}

function MiniCard({
  title,
  amount,
  color,
  bg,
}: {
  title: string;
  amount: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: 16,
        border: `1px solid ${color}22`,
        padding: "14px",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color,
          fontWeight: 800,
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color,
        }}
      >
        {amount}
      </div>
    </div>
  );
}