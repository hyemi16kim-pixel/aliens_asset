"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, TrendingUp, TrendingDown, Target } from "lucide-react";
import Link from "next/link";

type Goal = {
  id: number;
  title: string;
  icon?: string | null;
  isPinned?: boolean;
  targetAmount: number;
  currentAmount: number;
};

const money = (v: number) => `₩${Number(v || 0).toLocaleString()}`;

// 잔액형: targetAmount < 0
const isBalanceGoal = (goal: Goal) => goal.targetAmount < 0;

const calcGoalProgress = (goal: Goal) => {
  if (isBalanceGoal(goal)) {
    // 잔액형: 사용량 / 총 자금
    const total = Math.abs(goal.targetAmount);
    const used = total - Math.abs(goal.currentAmount);
    return total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 0;
  }
  // 저축형
  return goal.targetAmount > 0
    ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
    : 0;
};

/* ═══════════════════════════════════════
   슬라이드 1: 총 공동 자산
═══════════════════════════════════════ */

// 파티클 데이터 상수 (컴포넌트 바깥)
type Particle = { right: number; top: string; size: number; op: number; anim: string; label: string };
const EMOJI_PARTICLES: Particle[] = [
  { right: 14, top: "2%",  size: 28, op: 0.82, anim: "floatBob 4s ease-in-out infinite 0s",    label: "👽" },
  { right: 52, top: "8%",  size: 11, op: 0.50, anim: "floatBob 3.2s ease-in-out infinite 1.1s", label: "✨" },
  { right: 78, top: "4%",  size: 9,  op: 0.40, anim: "floatBob 4.8s ease-in-out infinite 2.3s", label: "⭐" },
  { right: 34, top: "38%", size: 9,  op: 0.40, anim: "floatBob 4.5s ease-in-out infinite 0.7s", label: "💫" },
  { right: 65, top: "42%", size: 11, op: 0.38, anim: "floatBob 3.6s ease-in-out infinite 1.9s", label: "🌙" },
  { right: 18, top: "72%", size: 10, op: 0.42, anim: "floatBob 5s ease-in-out infinite 0.4s",   label: "⭐" },
  { right: 55, top: "78%", size: 8,  op: 0.35, anim: "floatBob 3.8s ease-in-out infinite 1.5s", label: "✨" },
  { right: 82, top: "68%", size: 10, op: 0.32, anim: "floatBob 4.2s ease-in-out infinite 2.8s", label: "💫" },
  { right: 60, top: "50%", size: 18, op: 0.55, anim: "floatBob 5.2s ease-in-out infinite 1.0s", label: "👽" },
];
type Dot = { r: number; t: string; s: number };
const STAR_DOTS: Dot[] = [
  { r: 28, t: "20%", s: 5 }, { r: 90, t: "28%", s: 4 }, { r: 46, t: "60%", s: 5 },
  { r: 72, t: "55%", s: 4 }, { r: 22, t: "48%", s: 3 }, { r: 60, t: "88%", s: 4 },
  { r: 38, t: "92%", s: 3 }, { r: 84, t: "82%", s: 5 },
];

function PanelAsset({ data }: { data?: any }) {
  const [includeDebt, setIncludeDebt] = useState(true);
  const totalAsset = Number(data?.totalAsset ?? 0);
  const debtAmount = Number(data?.debtAmount ?? 0);
  const displayAsset = includeDebt ? totalAsset : totalAsset + debtAmount;
  const monthlyChange = (data?.totalIncome || 0) - (data?.totalExpense || 0);
  const isPositive = monthlyChange >= 0;

  return (
    <div style={{ position: "relative", minHeight: 140 }}>
      {/* 애니메이션 키프레임 */}
      <style>{[
        "@keyframes floatBob {",
        "  0%   { transform: translateY(0px) rotate(0deg); }",
        "  40%  { transform: translateY(-9px) rotate(8deg); }",
        "  70%  { transform: translateY(-5px) rotate(-4deg); }",
        "  100% { transform: translateY(0px) rotate(0deg); }",
        "}",
        "@keyframes orbPulse {",
        "  0%   { transform: scale(1);    opacity: 0.10; }",
        "  50%  { transform: scale(1.2);  opacity: 0.20; }",
        "  100% { transform: scale(1);    opacity: 0.10; }",
        "}",
        "@keyframes twinkle {",
        "  0%,100% { opacity: 0.15; transform: scale(0.8); }",
        "  50%     { opacity: 0.55; transform: scale(1.2); }",
        "}",
      ].join("\n")}</style>

      {/* ── 배경 오브 ── */}
      <div style={{ position: "absolute", top: -18, right: 4,  width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.13)", animation: "orbPulse 3.5s ease-in-out infinite",      pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 40,  right: 50, width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.09)", animation: "orbPulse 4.2s ease-in-out infinite 1.1s", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 90,  right: 10, width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.08)", animation: "orbPulse 3.8s ease-in-out infinite 0.6s", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 110, right: 70, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", animation: "orbPulse 5s ease-in-out infinite 1.8s",   pointerEvents: "none" }} />

      {/* ── 플로팅 이모지 ── */}
      {EMOJI_PARTICLES.map((p, i) => (
        <div key={i} style={{ position: "absolute", right: p.right, top: p.top, fontSize: p.size, opacity: p.op, pointerEvents: "none", userSelect: "none", animation: p.anim }}>
          {p.label}
        </div>
      ))}

      {/* ── 반짝이 점 ── */}
      {STAR_DOTS.map((d, i) => (
        <div key={i} style={{ position: "absolute", right: d.r, top: d.t, width: d.s, height: d.s, borderRadius: "50%", background: "white", pointerEvents: "none", animation: "twinkle " + (2.5 + i * 0.4) + "s ease-in-out infinite " + (i * 0.35) + "s" }} />
      ))}

      {/* 레이블 + 토글 */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIncludeDebt((p) => !p); }}
          style={{
            border: "1px solid rgba(255,255,255,0.28)",
            background: "rgba(255,255,255,0.14)",
            color: "white",
            width: 26, height: 26, borderRadius: 999,
            display: "grid", placeItems: "center",
            cursor: "pointer", padding: 0, flexShrink: 0,
          }}
          title="부채 포함/제외"
        >
          <Sparkles size={12} />
        </button>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: 0.5 }}>
          {"총 공동 자산 · "}{includeDebt ? "부채 포함" : "부채 제외"}
        </div>
      </div>

      {/* 자산 금액 */}
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1.5px", marginBottom: 16, color: displayAsset < 0 ? "#FFB3C6" : "#ffffff" }}>
        {money(displayAsset)}
      </div>

      {/* 이번 달 변동 배지 */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.15)",
        borderRadius: 12, padding: "7px 12px",
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        {isPositive
          ? <TrendingUp size={13} color="#A8F0CF" />
          : <TrendingDown size={13} color="#FFB3C1" />}
        <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{"이번 달 변동"}</span>
        <span style={{ fontSize: 14, fontWeight: 900, color: isPositive ? "#A8F0CF" : "#FFB3C1" }}>
          {isPositive ? "+" : "-"}{money(Math.abs(monthlyChange))}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   슬라이드 2: 목표 자산
═══════════════════════════════════════ */
function PanelGoal({ goals, data }: { goals?: Goal[]; data?: any }) {
  // 핀된 목표 우선 최대 2개, 없으면 순서대로 2개
  const allGoals = goals || [];
  const pinned = allGoals.filter((g) => g.isPinned);
  const list = pinned.length > 0 ? pinned.slice(0, 2) : allGoals.slice(0, 2);
  // 전체 달성률: 저축형 + 잔액형 모두 포함, 각 목표 달성률 평균
  const overallProgress = allGoals.length > 0
    ? Math.round(allGoals.reduce((s, g) => s + calcGoalProgress(g), 0) / allGoals.length)
    : 0;

  // 원형 진행률 SVG
  const R = 34;
  const circ = 2 * Math.PI * R;
  const dashOffset = circ * (1 - overallProgress / 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={14} color="#059669" />
          <span style={{ fontSize: 13, fontWeight: 900, color: "#1A3D2B" }}>{"목표"}</span>
        </div>
        <Link href="/goals" style={{ fontSize: 11, color: "#059669", textDecoration: "none", fontWeight: 800 }}>
          {"전체 보기 →"}
        </Link>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "18px 0", color: "#6B7280" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>{"🎯"}</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{"등록된 목표가 없습니다"}</div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* 왼쪽: 목표 목록 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {list.slice(0, 2).map((goal, i) => {
              const progress = calcGoalProgress(goal);
              const isBalance = isBalanceGoal(goal);
              const barColor = isBalance
                ? "linear-gradient(90deg, #FB923C, #F97316)"
                : "linear-gradient(90deg, #34D399, #059669)";
              const barBg = isBalance ? "rgba(249,115,22,0.12)" : "rgba(5,150,105,0.15)";
              const borderColor = isBalance ? "rgba(249,115,22,0.2)" : "rgba(5,150,105,0.18)";
              const bgColor = isBalance ? "rgba(249,115,22,0.05)" : "rgba(5,150,105,0.06)";
              return (
                <div key={goal.id} style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: `1px solid ${borderColor}`,
                  background: bgColor,
                  marginBottom: i === 0 && list.length > 1 ? 6 : 0,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <span style={{ fontSize: 14 }}>{goal.icon || (isBalance ? "📉" : "🎯")}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#1A3D2B", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{goal.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: isBalance ? "#F97316" : "#E11D73", flexShrink: 0 }}>{progress}%</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: barBg }}>
                    <div style={{ width: `${progress}%`, height: "100%", borderRadius: 999, background: barColor, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ fontSize: 10, color: isBalance ? "#F97316" : "#059669", marginTop: 4, fontWeight: 700 }}>
                    {isBalance
                      ? `${money(Math.abs(goal.targetAmount))} 중 ${money(Math.abs(goal.currentAmount))} 남음`
                      : `${money(goal.currentAmount)} / 목표 ${money(goal.targetAmount)}`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 오른쪽: 원형 진행률 */}
          {allGoals.length > 0 && (
            <div style={{ flexShrink: 0, position: "relative", width: 80, height: 80 }}>
              <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(5,150,105,0.15)" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r={R} fill="none"
                  stroke="#059669" strokeWidth="7"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#059669", lineHeight: 1 }}>{overallProgress}%</span>
                <span style={{ fontSize: 9, color: "#6B7280", fontWeight: 700, marginTop: 2 }}>{"달성"}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   슬라이드 3: 커플 지출 비중
═══════════════════════════════════════ */
function PanelCouple({ data }: { data?: any }) {
  const ownerExpenses: Record<string, number> = data?.ownerExpenses || {};
  const familyUsers: { id: number; name: string; role: string }[] = data?.familyUsers || [];

  const userA = familyUsers[0]?.name || "사용자A";
  const userB = familyUsers[1]?.name || "사용자B";
  const shared = ownerExpenses["공동"] || 0;
  const amtA = (ownerExpenses[userA] || 0) + shared / 2;
  const amtB = (ownerExpenses[userB] || 0) + shared / 2;
  const total = amtA + amtB;
  const pctA = total > 0 ? Math.round((amtA / total) * 100) : 50;
  const pctB = 100 - pctA;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#2D1B3D" }}>{"커플 지출 비중"}</span>
        <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{"이번 달"}</span>
      </div>

      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "18px 0", color: "#9CA3AF" }}>
          <div style={{ fontSize: 26, marginBottom: 6 }}>{"👽"}</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{"지출 내역이 없습니다"}</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 2 }}>{userA}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#059669", letterSpacing: "-0.5px" }}>{pctA}%</div>
            </div>
            <div style={{ fontSize: 12, color: "#D1D5DB", fontWeight: 900, paddingBottom: 4 }}>{"vs"}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, marginBottom: 2 }}>{userB}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#E11D73", letterSpacing: "-0.5px" }}>{pctB}%</div>
            </div>
          </div>

          <div style={{ height: 12, borderRadius: 999, display: "flex", overflow: "hidden", gap: 2, marginBottom: 12, boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)" }}>
            <div style={{ width: `${pctA}%`, background: "linear-gradient(90deg, #34D399, #059669)", borderRadius: 999, transition: "width 0.5s ease" }} />
            <div style={{ width: `${pctB}%`, background: "linear-gradient(90deg, #F472B6, #E11D73)", borderRadius: 999, transition: "width 0.5s ease" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{money(amtA)}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#E11D73" }}>{money(amtB)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   통합 히어로 카드 (슬라이드 3개)
═══════════════════════════════════════ */
const BG = [
  "linear-gradient(135deg, #8B78FF 0%, #A99BFF 55%, #C4B9FF 100%)",
  "linear-gradient(135deg, #FFFFFF 0%, #EDFFF7 100%)",
  "linear-gradient(135deg, #FFFFFF 0%, #FFF0F8 100%)",
];

function HeroCard({ data, goals }: { data?: any; goals?: Goal[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const TOTAL = 3;

  const next = () => setCurrent((c) => Math.min(c + 1, TOTAL - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  // ✅ stopPropagation으로 페이지 스와이프 차단
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
    touchStartX.current = null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };



  return (
    <div>
      <div
        style={{
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 12px 40px rgba(100,70,220,0.28)",
          position: "relative",
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {/* ── 배경 색상 레이어 (슬라이드에 따라 전환) ── */}
        <div style={{
          background: BG[current],
          transition: "background 0.4s ease",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* 배경 장식 */}
          <div style={{ position: "absolute", top: -60, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)", filter: "blur(36px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, right: 60, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.05)", filter: "blur(28px)", pointerEvents: "none" }} />

          {/* ── 슬라이드 뷰포트: overflow hidden + 동적 우측 패딩 ── */}
          <div style={{ overflow: "hidden" }}>
            <div style={{
              display: "flex",
              /* 트랙 너비 = TOTAL * 100% of viewport */
              width: `${TOTAL * 100}%`,
              transform: `translateX(calc(-${current} * ${100 / TOTAL}%))`,
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
            }}>
              {/* 슬라이드 1 */}
              <div style={{ width: `${100 / TOTAL}%`, flexShrink: 0, padding: "22px 22px 24px 22px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <PanelAsset data={data} />
              </div>
              {/* 슬라이드 2 */}
              <div style={{ width: `${100 / TOTAL}%`, flexShrink: 0, padding: "22px 22px 24px 22px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <PanelGoal goals={goals} data={data} />
              </div>
              {/* 슬라이드 3 */}
              <div style={{ width: `${100 / TOTAL}%`, flexShrink: 0, padding: "22px 22px 24px 22px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <PanelCouple data={data} />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── 도트 인디케이터 (카드 바깥) ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 20 : 7,
              height: 7,
              borderRadius: 999,
              border: "none",
              background: i === current ? "#7C5CFF" : "#DDD6FE",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.25s ease",
            }}
            aria-label={`슬라이드 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   정적 카드: 이번 달 수입/지출
═══════════════════════════════════════ */
function MonthSummaryCard({ data }: { data?: any }) {
  const income = data?.totalIncome || 0;
  const expense = data?.totalExpense || 0;
  const total = income - expense;
  const [rangeText, setRangeText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("alien_date_range") || "";
    setRangeText(saved);
  }, []);

  return (
    <section style={{
      background: "white",
      borderRadius: 24,
      border: "1px solid #EDE6F9",
      boxShadow: "0 6px 24px rgba(167,139,250,0.10)",
      padding: "18px 18px 16px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#2D2545" }}>{"이번 달 요약"}</span>
        {rangeText && (
          <span style={{ fontSize: 11, color: "#C4B8D8", fontWeight: 600 }}>{rangeText}</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{
          background: "linear-gradient(160deg, #ECFFF6 0%, #E0FFF2 100%)",
          borderRadius: 18, border: "1.5px solid #A7F3D0", padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(16,185,129,0.15)", display: "grid", placeItems: "center" }}>
              <TrendingUp size={13} color="#10B981" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981" }}>{"수입"}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#059669", letterSpacing: "-0.5px" }}>{money(income)}</div>
        </div>

        <div style={{
          background: "linear-gradient(160deg, #FFF3F6 0%, #FFE8EE 100%)",
          borderRadius: 18, border: "1.5px solid #FFCCD8", padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(255,107,129,0.15)", display: "grid", placeItems: "center" }}>
              <TrendingDown size={13} color="#FF6B81" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#FF6B81" }}>{"지출"}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#FF3B70", letterSpacing: "-0.5px" }}>{money(expense)}</div>
        </div>
      </div>

      <div style={{
        background: total >= 0
          ? "linear-gradient(160deg, #F4EFFE 0%, #EDE6FC 100%)"
          : "linear-gradient(160deg, #FFF3F6 0%, #FFE8EE 100%)",
        borderRadius: 16,
        border: `1.5px solid ${total >= 0 ? "#DDD6FE" : "#FFCCD8"}`,
        padding: "12px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#B0A8C8" }}>{"이번 달 합계"}</span>
        <strong style={{ fontSize: 15, fontWeight: 900, color: total >= 0 ? "#7C5CFF" : "#FF3B70" }}>
          {total >= 0 ? "+" : "-"}{money(Math.abs(total))}
        </strong>
      </div>
    </section>
  );
}
export default function HeroSlider({ data, goals }: { data?: any; goals?: Goal[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <HeroCard data={data} goals={goals} />
      <MonthSummaryCard data={data} />
    </div>
  );
}
