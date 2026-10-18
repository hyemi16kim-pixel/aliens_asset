"use client";

import { useEffect, useMemo, useState } from "react";
import { getBaseMonthByStartDay, getCustomMonthRange } from "@/components/lib/monthRange";

/**
 * 우리의 자산아리 🌱
 *
 * - 목표 자산(5억)을 50단계로 나눠 레벨 1~50 (1레벨 = 1,000만원)
 * - 이미지: public/chicks/lvNN_1~4.png  (1 화남 · 2 웃음 · 3 울음 · 4 무표정)
 *   앱에 들어올 때마다 해당되는 한줄평 중 하나를 무작위로 고르고, 그 기분에 맞는 표정을 보여줌
 *   그 표정 이미지가 없으면 다른 표정을 시도하고, 하나도 없으면 🐣 이모지로 대신 표시
 * - 레벨 구간별 주변 효과(오라·파티클)는 CSS로 그림
 * - 한줄평: 이번 달/오늘 소비 데이터를 보고 해당되는 문장 중 하나를 무작위로 말함 (병아리를 누르면 다른 말)
 */

const GOAL = 500_000_000; // 목표 5억
const MAX_LEVEL = 50;
const STEP = GOAL / MAX_LEVEL; // 레벨당 1,000만원
const VARIANTS = 4;

type Tx = {
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  transactionAt: string;
  category?: string | null;
};

type Props = {
  totalAssets: number;
  transactions: Tx[];
  budgets: Record<string, number>;
  monthStartDay: number;
};

/* ───────── 레벨 구간 (이미지 분위기에 맞춘 효과) ───────── */
type Tier = {
  from: number;
  to: number;
  title: string;
  bg: string; // 무대 배경
  glow: string; // 병아리 뒤 오라 색
  particle: string; // 떠다니는 파티클 (이모지 또는 "dot")
  particleColor?: string;
  ring?: string; // 회전 링 (conic-gradient)
};

const TIERS: Tier[] = [
  { from: 1, to: 10, title: "아기 병아리", bg: "linear-gradient(180deg,#FFF9E8 0%,#FFF1CC 100%)", glow: "rgba(255,214,102,0.55)", particle: "✨" },
  { from: 11, to: 20, title: "모험 병아리", bg: "linear-gradient(180deg,#F3FFE9 0%,#FFF4D6 100%)", glow: "rgba(160,220,120,0.5)", particle: "🍃" },
  { from: 21, to: 30, title: "견습 기사 병아리", bg: "linear-gradient(180deg,#EEF5FF 0%,#FFF4DB 100%)", glow: "rgba(120,170,255,0.45)", particle: "⭐" },
  { from: 31, to: 36, title: "불꽃 병아리", bg: "linear-gradient(180deg,#FFF0E6 0%,#FFE0CC 100%)", glow: "rgba(255,120,40,0.6)", particle: "dot", particleColor: "#FF7A1A" },
  { from: 37, to: 40, title: "번개 병아리", bg: "linear-gradient(180deg,#EAF4FF 0%,#E3E9FF 100%)", glow: "rgba(80,160,255,0.6)", particle: "⚡", ring: "conic-gradient(from 0deg, transparent 0 70%, rgba(90,170,255,0.9) 85%, transparent 100%)" },
  { from: 41, to: 44, title: "성기사 병아리", bg: "linear-gradient(180deg,#FFFBEA 0%,#F1ECFF 100%)", glow: "rgba(255,225,120,0.75)", particle: "✨", ring: "conic-gradient(from 0deg, transparent 0 60%, rgba(255,230,140,0.9) 80%, transparent 100%)" },
  { from: 45, to: 46, title: "피닉스 병아리", bg: "linear-gradient(180deg,#FFF3E0 0%,#FFD9B8 100%)", glow: "rgba(255,140,40,0.75)", particle: "🔥" },
  { from: 47, to: 48, title: "우주 병아리", bg: "radial-gradient(circle at 50% 40%,#3B2A6E 0%,#1C1538 70%)", glow: "rgba(170,110,255,0.7)", particle: "dot", particleColor: "#D9C2FF", ring: "conic-gradient(from 0deg, transparent 0 65%, rgba(190,140,255,0.95) 82%, transparent 100%)" },
  { from: 49, to: 50, title: "황금 왕관 병아리", bg: "linear-gradient(180deg,#FFF8DC 0%,#FFE7B0 100%)", glow: "rgba(255,200,60,0.8)", particle: "👑", ring: "repeating-conic-gradient(from 0deg, rgba(255,215,90,0.55) 0 8deg, transparent 8deg 22deg)" },
];

const tierOf = (level: number) => TIERS.find((t) => level >= t.from && level <= t.to) || TIERS[0];

const won = (v: number) =>
  v >= 100_000_000 ? `${(v / 100_000_000).toFixed(1)}억` : `${Math.round(v / 10_000).toLocaleString()}만`;

/* ───────── 한줄평 ───────── */
type Mood = "angry" | "happy" | "sad" | "neutral";
type Line = { text: string; mood: Mood };
// 표정 이미지 번호: 1 화남 · 2 웃음 · 3 울음 · 4 무표정
const MOOD_VARIANT: Record<Mood, number> = { angry: 1, happy: 2, sad: 3, neutral: 4 };
const ADJUST_CATEGORIES = ["자산수정", "자산 수정"]; // 잔고 맞춤 기록은 소비로 안 봄

function buildLines(
  transactions: Tx[],
  budgets: Record<string, number>,
  monthStartDay: number,
  level: number,
  levelProgress: number
): Line[] {
  const now = new Date();
  const cur = getCustomMonthRange(getBaseMonthByStartDay(now, monthStartDay), monthStartDay);
  const prevBase = getBaseMonthByStartDay(new Date(cur.start.getTime() - 1), monthStartDay);
  const prev = getCustomMonthRange(prevBase, monthStartDay);

  // 지난달은 "이번 달과 같은 날짜까지"만 비교 (공정한 비교)
  const elapsedMs = now.getTime() - cur.start.getTime();
  const prevSamePoint = new Date(Math.min(prev.start.getTime() + elapsedMs, prev.end.getTime()));
  const totalMs = cur.end.getTime() - cur.start.getTime();
  const elapsedRatio = Math.min(Math.max(elapsedMs / totalMs, 0.03), 1);

  const isExpense = (t: Tx) => t.type === "EXPENSE" && !ADJUST_CATEGORIES.includes(t.category || "");
  const sum = (from: Date, to: Date, pred: (t: Tx) => boolean) =>
    transactions.reduce((s, t) => {
      const d = new Date(t.transactionAt);
      return d >= from && d <= to && pred(t) ? s + Number(t.amount || 0) : s;
    }, 0);
  const cat = (name: string) => (t: Tx) => isExpense(t) && (t.category || "") === name;

  const lines: Line[] = [];
  const say = (text: string, mood: Mood) => lines.push({ text, mood });

  // 오늘 식비
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayFood = sum(todayStart, now, cat("식비"));
  if (now.getHours() >= 14 && todayFood === 0) say("오늘은 식비를 많이 아껴서 인내심을 많이 키웠어.", "happy");

  // 식비 (이번 달 vs 지난달 같은 시점)
  const foodNow = sum(cur.start, now, cat("식비"));
  const foodPrev = sum(prev.start, prevSamePoint, cat("식비"));
  if (foodPrev > 0 && foodNow < foodPrev * 0.85) say("지난달보다 식비를 아껴서 인내심이 쑥쑥 자랐어.", "happy");
  if (foodPrev > 0 && foodNow > foodPrev * 1.2) say("요즘 맛있는 걸 많이 먹어서 배가 빵빵해.", "neutral");

  // 공과금
  const billNow = sum(cur.start, now, cat("공과금"));
  const billPrev = sum(prev.start, prevSamePoint, cat("공과금"));
  if (billPrev > 0 && billNow > billPrev * 1.1) say("저번달 대비 많은 공과금을 내서 조금 피곤해.", "sad");
  if (billPrev > 0 && billNow < billPrev * 0.9) say("공과금이 지난달보다 덜 나와서 몸이 가벼워.", "happy");

  // 예산
  const budgetEntries = Object.entries(budgets || {}).filter(([, v]) => Number(v) > 0);
  if (budgetEntries.length > 0) {
    const over = budgetEntries.filter(([name, b]) => sum(cur.start, now, cat(name)) > Number(b));
    const totalBudget = budgetEntries.reduce((s, [, b]) => s + Number(b), 0);
    const totalSpent = budgetEntries.reduce((s, [name]) => s + sum(cur.start, now, cat(name)), 0);
    if (over.length > 0) {
      say(`${over[0][0]} 예산을 넘겨서 체력이 조금 떨어졌어.`, "angry");
    } else if (totalSpent <= totalBudget * elapsedRatio) {
      say("이번달은 예산 내로 생활비를 써서 지능이 올랐어.", "happy");
    }
  }

  // 수입 vs 지출
  const incNow = sum(cur.start, now, (t) => t.type === "INCOME" && !ADJUST_CATEGORIES.includes(t.category || ""));
  const expNow = sum(cur.start, now, isExpense);
  const expPrev = sum(prev.start, prevSamePoint, isExpense);
  if (incNow > expNow && incNow > 0) say("이번달은 쓴 것보다 번 게 많아서 몸집이 커졌어.", "happy");
  if (expPrev > 0 && expNow > expPrev * 1.15) say("지난달보다 지출 속도가 빨라서 숨이 조금 차.", "sad");
  if (expPrev > 0 && expNow < expPrev * 0.85) say("지난달보다 덜 써서 마음이 든든해.", "happy");

  // 레벨
  if (level < MAX_LEVEL && levelProgress >= 0.9) say("다음 레벨까지 거의 다 왔어! 조금만 더!", "happy");
  if (level >= MAX_LEVEL) say("목표 달성! 우리 이제 황금 병아리야.", "happy");

  if (lines.length === 0) {
    say("오늘도 차곡차곡 자라는 중이야.", "neutral");
    say(`${level}레벨 병아리, 오늘도 열심히 모으는 중!`, "neutral");
  }
  return lines;
}

/* ───────── 컴포넌트 ───────── */
export default function AssetChick({ totalAssets, transactions, budgets, monthStartDay }: Props) {
  const safeAssets = Math.max(totalAssets, 0);
  const level = Math.min(MAX_LEVEL, Math.floor(safeAssets / STEP) + 1);
  const levelBase = (level - 1) * STEP;
  const levelProgress = level >= MAX_LEVEL ? 1 : (safeAssets - levelBase) / STEP;
  const nextAmount = level * STEP;
  const tier = tierOf(level);

  const lines = useMemo(
    () => buildLines(transactions, budgets, monthStartDay, level, levelProgress),
    [transactions, budgets, monthStartDay, level, levelProgress]
  );

  // 무작위 값은 화면이 뜬 뒤에 정해야 서버/클라이언트 불일치가 없음
  const [lineIndex, setLineIndex] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    setLineIndex(Math.floor(Math.random() * lines.length));
    setTries(0);
  }, [lines.length, level]);

  const line = lineIndex === null ? null : lines[lineIndex] ?? lines[0];
  // 기분에 맞는 표정 번호부터 시작, 이미지가 없으면 다음 번호로
  const baseVariant = line ? MOOD_VARIANT[line.mood] : null;
  const variant = baseVariant ? ((baseVariant - 1 + tries) % VARIANTS) + 1 : null;
  const imageFailed = tries >= VARIANTS;
  const src = variant ? `/chicks/lv${String(level).padStart(2, "0")}_${variant}.png` : null;
  const onImgError = () => setTries((t) => t + 1);

  const nextLine = () => {
    if (lines.length <= 1) return;
    setTries(0);
    setLineIndex((i) => ((i ?? 0) + 1 + Math.floor(Math.random() * (lines.length - 1))) % lines.length);
  };

  const dark = tier.from === 47;
  const particles = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div>
      <style>{`
        @keyframes chickBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes chickGlow { 0%,100% { opacity: .65; transform: translate(-50%,-50%) scale(.92) } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.06) } }
        @keyframes chickRing { from { transform: translate(-50%,-50%) rotate(0deg) } to { transform: translate(-50%,-50%) rotate(360deg) } }
        @keyframes chickFloat { 0% { transform: translateY(0) scale(.7); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(-120px) scale(1.05); opacity: 0 } }
        @keyframes chickTwinkle { 0%,100% { opacity: .15 } 50% { opacity: 1 } }
        @keyframes bubbleIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* 무대 */}
      <div
        style={{
          position: "relative",
          height: 210,
          borderRadius: 20,
          overflow: "hidden",
          background: tier.bg,
          marginTop: 12,
        }}
      >
        {/* 우주 구간: 반짝이는 별 배경 */}
        {dark &&
          Array.from({ length: 18 }, (_, i) => (
            <span
              key={`s${i}`}
              style={{
                position: "absolute",
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: 2,
                height: 2,
                borderRadius: 2,
                background: "#fff",
                animation: `chickTwinkle ${1.6 + (i % 5) * 0.4}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}

        {/* 오라 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            width: 170,
            height: 170,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${tier.glow} 0%, transparent 68%)`,
            animation: "chickGlow 2.6s ease-in-out infinite",
          }}
        />

        {/* 회전 링 (번개/성기사/우주/황금) */}
        {tier.ring && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              width: 176,
              height: 176,
              borderRadius: "50%",
              background: tier.ring,
              WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%, #000 66%, transparent 68%)",
              mask: "radial-gradient(circle, transparent 58%, #000 60%, #000 66%, transparent 68%)",
              animation: `chickRing ${tier.from === 49 ? 14 : 3.2}s linear infinite`,
            }}
          />
        )}

        {/* 떠오르는 파티클 */}
        {particles.map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${18 + ((i * 11) % 64)}%`,
              bottom: 12,
              fontSize: 13,
              animation: `chickFloat ${2.8 + (i % 3) * 0.7}s ease-in ${i * 0.55}s infinite`,
              pointerEvents: "none",
            }}
          >
            {tier.particle === "dot" ? (
              <span
                style={{
                  display: "block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: tier.particleColor,
                  boxShadow: `0 0 6px ${tier.particleColor}`,
                }}
              />
            ) : (
              tier.particle
            )}
          </span>
        ))}

        {/* 병아리 */}
        <button
          type="button"
          onClick={nextLine}
          aria-label="자산아리에게 말 걸기"
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            transform: "translate(-50%,-50%)",
            width: 140,
            height: 140,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <div style={{ width: "100%", height: "100%", animation: "chickBob 2.2s ease-in-out infinite", display: "grid", placeItems: "center" }}>
            {src && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`자산아리 LV.${level}`}
                onError={onImgError}
                style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 6px 8px rgba(120,80,0,0.18))" }}
              />
            ) : (
              <span style={{ fontSize: 76, lineHeight: 1 }}>🐣</span>
            )}
          </div>
        </button>

        {/* 레벨 배지 */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(45,37,69,0.82)",
            color: "#FFE58A",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0.3,
          }}
        >
          LV.{level} · {tier.title}
        </div>
      </div>

      {/* 한줄평 말풍선 */}
      <div
        key={lineIndex ?? -1}
        onClick={nextLine}
        style={{
          position: "relative",
          margin: "12px 4px 0",
          padding: "11px 14px",
          borderRadius: 16,
          background: "#FFFBEF",
          border: "1.5px solid #F6E3A6",
          fontSize: 13,
          fontWeight: 700,
          color: "#5C4A1E",
          lineHeight: 1.45,
          animation: "bubbleIn .35s ease-out",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: -7,
            left: "50%",
            width: 12,
            height: 12,
            background: "#FFFBEF",
            borderLeft: "1.5px solid #F6E3A6",
            borderTop: "1.5px solid #F6E3A6",
            transform: "translateX(-50%) rotate(45deg)",
          }}
        />
        🐥 {line?.text ?? "..."}
      </div>

      {/* 레벨 진행 */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9B8EC8", marginBottom: 5 }}>
          <span>
            현재 자산 <strong style={{ color: "#7C5CFF" }}>{won(safeAssets)}원</strong>
          </span>
          <span>
            {level >= MAX_LEVEL ? (
              <strong style={{ color: "#FF6B9D" }}>목표 5억 달성 🎉</strong>
            ) : (
              <>
                LV.{level + 1}까지 <strong style={{ color: "#FF6B9D" }}>{won(nextAmount - safeAssets)}원</strong>
              </>
            )}
          </span>
        </div>
        <div style={{ height: 6, background: "#EDE6F9", borderRadius: 999, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.round(levelProgress * 100)}%`,
              background: "linear-gradient(90deg, #FFC93C, #FF9F43)",
              borderRadius: 999,
              transition: "width 1.2s ease",
            }}
          />
        </div>
        <div style={{ marginTop: 5, fontSize: 10, color: "#B0A8C8", textAlign: "right" }}>
          목표 5억 · 1레벨 = 1,000만원
        </div>
      </div>
    </div>
  );
}
