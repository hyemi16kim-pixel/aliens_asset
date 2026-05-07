"use client";

import { useEffect, useState } from "react";
import { theme } from "@/components/lib/theme";
import Link from "next/link";

type Goal = {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
};

export default function GoalCard({ goals = [] }: { goals?: Goal[] }) {
  return (
    <section
      style={{
        background: "white",
        borderRadius: 22,
        padding: "16px",
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <strong style={{ fontSize: 14 }}>목표 진행률</strong>
<Link
  href="/goals"
  style={{
    fontSize: 11,
    fontWeight: 800,
    color: theme.colors.primary,
    textDecoration: "none",
  }}
>
  전체 보기
</Link>
      </div>

      {goals.length === 0 ? (
        <div style={{ fontSize: 12, color: theme.colors.subtext }}>
          등록된 목표가 없습니다.
        </div>
      ) : (
        goals.slice(0, 2).map((goal, i) => {
          const progress = Math.min(
            100,
            Math.round((goal.currentAmount / goal.targetAmount) * 100)
          );

          return (
            <GoalItem
              key={goal.id}
              icon={i === 0 ? "✈️" : "🏡"}
              title={goal.title}
              current={`₩${goal.currentAmount.toLocaleString()}`}
              goal={`₩${goal.targetAmount.toLocaleString()}`}
              progress={progress}
            />
          );
        })
      )}
    </section>
  );
}

function GoalItem({
  icon,
  title,
  current,
  goal,
  progress,
}: {
  icon: string;
  title: string;
  current: string;
  goal: string;
  progress: number;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 11, color: theme.colors.subtext, marginTop: 3 }}>
            {current} / {goal}
          </div>
        </div>

        <strong style={{ color: theme.colors.primary }}>{progress}%</strong>
      </div>

      <div
        style={{
          marginTop: 8,
          width: "100%",
          height: 6,
          borderRadius: 999,
          background: theme.colors.primarySoft,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: theme.colors.primary,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}