"use client";

import Link from "next/link";
import { Target } from "lucide-react";

type Goal = {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
};

const GOAL_EMOJIS = ["✈️", "🏡", "💍", "🎓", "🚗", "💻", "🌏", "🎯"];

export default function GoalCard({ goals = [] }: { goals?: Goal[] }) {
  return (
    <section style={{
      background: "white",
      borderRadius: 24,
      border: "1px solid #EDE6F9",
      boxShadow: "0 6px 24px rgba(167,139,250,0.10)",
      padding: "18px 18px 16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 26, height: 26, borderRadius: 9, background: "#F4EFFE", display: "grid", placeItems: "center" }}>
            <Target size={14} color="#7C5CFF" />
          </div>
          <strong style={{ fontSize: 14, fontWeight: 900, color: "#2D2545" }}>목표 진행률</strong>
        </div>
        <Link href="/goals" style={{ fontSize: 11, fontWeight: 800, color: "#A78BFA", textDecoration: "none" }}>
          전체 보기 →
        </Link>
      </div>

      {goals.length === 0 ? (
        <div style={{
          background: "#FAFAFF", borderRadius: 16, border: "1px dashed #DDD6FE",
          padding: "20px", textAlign: "center",
        }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🎯</div>
          <div style={{ fontSize: 12, color: "#C4B8D8", fontWeight: 600 }}>등록된 목표가 없습니다</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {goals.slice(0, 2).map((goal, i) => {
            const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            return (
              <GoalItem
                key={goal.id}
                emoji={GOAL_EMOJIS[i] || "🎯"}
                title={goal.title}
                current={goal.currentAmount}
                target={goal.targetAmount}
                progress={progress}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function GoalItem({ emoji, title, current, target, progress }: {
  emoji: string; title: string;
  current: number; target: number; progress: number;
}) {
  const money = (v: number) => `₩${v.toLocaleString()}`;
  const isNear = progress >= 75;

  return (
    <div style={{
      background: "linear-gradient(160deg, #F9F5FF 0%, #F4EFFE 100%)",
      borderRadius: 18, border: "1px solid #EDE6F9",
      padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14,
          background: "white", border: "1px solid #EDE6F9",
          display: "grid", placeItems: "center", fontSize: 22,
          boxShadow: "0 2px 8px rgba(167,139,250,0.10)",
          flexShrink: 0,
        }}>{emoji}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#2D2545", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          <div style={{ fontSize: 11, color: "#B0A8C8", marginTop: 2 }}>
            {money(current)} <span style={{ color: "#DDD6FE" }}>/</span> {money(target)}
          </div>
        </div>

        <div style={{
          minWidth: 42, height: 28, borderRadius: 999, padding: "0 10px",
          background: isNear ? "linear-gradient(135deg, #10B981, #34D399)" : "linear-gradient(135deg, #7C5CFF, #A78BFA)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isNear ? "0 3px 10px rgba(16,185,129,0.3)" : "0 3px 10px rgba(124,92,255,0.3)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: "white" }}>{progress}%</span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div style={{ height: 7, borderRadius: 999, background: "#EDE6F9", overflow: "hidden" }}>
        <div style={{
          width: `${progress}%`, height: "100%", borderRadius: 999,
          background: isNear
            ? "linear-gradient(90deg, #10B981, #34D399)"
            : "linear-gradient(90deg, #7C5CFF, #A78BFA)",
          transition: "width 0.5s ease",
          boxShadow: isNear ? "0 0 8px rgba(16,185,129,0.4)" : "0 0 8px rgba(124,92,255,0.4)",
        }} />
      </div>
    </div>
  );
}
