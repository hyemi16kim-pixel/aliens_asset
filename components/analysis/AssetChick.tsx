"use client";

import { useEffect, useMemo, useState } from "react";
import { buildChickLines, type ChickLine, type ChickTx, type Mood } from "@/components/analysis/chickLines";

/**
 * 우리의 자산아리 🌱
 *
 * - 목표 자산(5억)을 50단계로 나눠 레벨 1~50 (1레벨 = 1,000만원)
 * - 진화 단계·연출 강도는 「병아리 레벨별 외형 설계 LV6-50」 엑셀 기준
 *   (LV.1~5는 엑셀 범위 밖이라 '아기 병아리'로 둠)
 * - 이미지: public/chicks/lvNN_1~5.png  (1 화남 · 2 웃음 · 3 울음 · 4 무표정 · 5 놀람)
 *   해당되는 한줄평 중 하나를 무작위로 고르고, 그 기분에 맞는 표정을 보여줌
 *   그 표정 이미지가 없으면 비슷한 표정 → 무표정 순으로 대신하고, 하나도 없으면 🐣
 * - 이미지 안에도 오라가 그려지므로, 화면 효과는 배경 무대 역할로 은은하게 깔아줌
 */

const GOAL = 500_000_000; // 목표 5억
const MAX_LEVEL = 50;
const STEP = GOAL / MAX_LEVEL; // 레벨당 1,000만원

type Props = {
  totalAssets: number;
  transactions: ChickTx[];
  budgets: Record<string, number>;
  monthStartDay: number;
};

/* ───────── 진화 단계 (엑셀 '진화 단계표') ───────── */
type Stage = {
  from: number;
  to: number;
  title: string;
  bg: string; // 무대 배경
  glow: string; // 병아리 뒤 오라 색
  particle: string; // 떠오르는 파티클: 이모지 또는 "dot"
  particleColor?: string;
  floorRings: number; // 발밑 빛 링 겹수
  floorColor: string;
  pulse?: string; // 퍼져나가는 파동 색
  ring?: string; // 회전 광륜 (conic-gradient)
  pillars?: boolean; // 빛기둥
};

const STAGES: Stage[] = [
  { from: 1, to: 5, title: "아기 병아리", bg: "linear-gradient(180deg,#FFF9E8 0%,#FFF1CC 100%)", glow: "rgba(255,214,102,0.5)", particle: "✨", floorRings: 0, floorColor: "rgba(255,200,80,0.6)" },
  { from: 6, to: 10, title: "초급 성장", bg: "linear-gradient(180deg,#F6FFE9 0%,#FFF3D2 100%)", glow: "rgba(190,235,130,0.5)", particle: "dot", particleColor: "#B8E986", floorRings: 1, floorColor: "rgba(255,205,80,0.65)" },
  { from: 11, to: 15, title: "숙련 탐험", bg: "linear-gradient(180deg,#FFF8E6 0%,#FBE9C4 100%)", glow: "rgba(255,205,90,0.55)", particle: "✨", floorRings: 2, floorColor: "rgba(255,195,60,0.7)" },
  { from: 16, to: 20, title: "정찰 대원", bg: "linear-gradient(180deg,#F3F8EC 0%,#FBE8C2 100%)", glow: "rgba(255,200,70,0.6)", particle: "dot", particleColor: "#FFD24A", floorRings: 2, floorColor: "rgba(255,190,50,0.75)" },
  { from: 21, to: 25, title: "전투 입문", bg: "linear-gradient(180deg,#FFF6E0 0%,#F6DFB0 100%)", glow: "rgba(255,190,50,0.65)", particle: "✨", floorRings: 3, floorColor: "rgba(255,180,40,0.8)", pulse: "rgba(255,200,70,0.7)" },
  { from: 26, to: 30, title: "숙련 전사", bg: "linear-gradient(180deg,#EEF4FF 0%,#FBEBC8 100%)", glow: "rgba(120,170,255,0.55)", particle: "dot", particleColor: "#8AB8FF", floorRings: 3, floorColor: "rgba(255,190,60,0.8)", pulse: "rgba(110,160,255,0.7)" },
  { from: 31, to: 35, title: "정예 기사", bg: "linear-gradient(180deg,#EAF1FF 0%,#FFE6D2 100%)", glow: "rgba(100,150,255,0.6)", particle: "dot", particleColor: "#FF8A3D", floorRings: 3, floorColor: "rgba(255,170,60,0.8)", pulse: "rgba(110,160,255,0.75)" },
  { from: 36, to: 40, title: "화염 영웅", bg: "linear-gradient(180deg,#FFF0E4 0%,#FFD3B4 100%)", glow: "rgba(255,110,40,0.7)", particle: "🔥", floorRings: 3, floorColor: "rgba(255,120,40,0.8)", ring: "conic-gradient(from 0deg, transparent 0 62%, rgba(255,120,40,0.9) 80%, rgba(255,200,80,0.9) 88%, transparent 100%)" },
  { from: 41, to: 45, title: "천공 전설", bg: "linear-gradient(180deg,#FFFBEA 0%,#ECE6FF 100%)", glow: "rgba(255,225,120,0.8)", particle: "⭐", floorRings: 3, floorColor: "rgba(255,210,90,0.85)", ring: "conic-gradient(from 0deg, transparent 0 55%, rgba(255,230,140,0.95) 75%, rgba(160,200,255,0.9) 85%, transparent 100%)", pulse: "rgba(255,230,140,0.8)" },
  { from: 46, to: 50, title: "불사조 신화", bg: "linear-gradient(180deg,#FFF4DE 0%,#FFCF9E 100%)", glow: "rgba(255,150,40,0.85)", particle: "🔥", floorRings: 3, floorColor: "rgba(255,170,50,0.9)", ring: "repeating-conic-gradient(from 0deg, rgba(255,200,80,0.6) 0 8deg, transparent 8deg 22deg)", pulse: "rgba(255,170,60,0.8)", pillars: true },
];

const stageOf = (level: number) => STAGES.find((s) => level >= s.from && level <= s.to) || STAGES[0];

// 엑셀 '연출 강도' (LV.6~50). LV.1~5는 1
const INTENSITY: Record<number, number> = {
  6: 1, 7: 1, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3,
  18: 4, 19: 4, 20: 4, 21: 4, 22: 4, 23: 5, 24: 5, 25: 5, 26: 5, 27: 5,
  28: 6, 29: 6, 30: 6, 31: 6, 32: 6, 33: 7, 34: 7, 35: 7, 36: 7,
  37: 8, 38: 8, 39: 8, 40: 8, 41: 8, 42: 8, 43: 9, 44: 9, 45: 9, 46: 9, 47: 9,
  48: 10, 49: 10, 50: 10,
};
const intensityOf = (level: number) => INTENSITY[level] ?? 1;

// "초급 성장" → "초급 성장으로", "천공 전설" → "천공 전설로" (받침 없거나 ㄹ이면 '로')
const withRo = (word: string) => {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${word}로`;
  const jong = (code - 0xac00) % 28;
  return `${word}${jong === 0 || jong === 8 ? "로" : "으로"}`;
};

const won = (v: number) =>
  v >= 100_000_000 ? `${(v / 100_000_000).toFixed(1)}억` : `${Math.round(v / 10_000).toLocaleString()}만`;

/* ───────── 표정 ───────── */
// 이미지 번호: 1 화남 · 2 웃음 · 3 울음 · 4 무표정 · 5 놀람
// 해당 표정 이미지가 없을 때 대신 쓸 순서
const MOOD_FALLBACK: Record<Mood, number[]> = {
  angry: [1, 4, 2],
  happy: [2, 4],
  sad: [3, 4],
  neutral: [4, 2],
  surprised: [5, 4, 2],
};

// 상태 리액션·조언을 인사/잡담보다 3배 자주 고름 (직전과 같은 상황은 피함)
function pickLine(lines: ChickLine[], exclude: number | null) {
  const weights: number[] = lines.map((l, i) => (i === exclude && lines.length > 1 ? 0 : l.kind === "idle" ? 1 : 3));
  const sumW = weights.reduce((x, y) => x + y, 0);
  let r = Math.random() * sumW;
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      idx = i;
      break;
    }
  }
  const textIdx = Math.floor(Math.random() * lines[idx].texts.length);
  return { idx, textIdx };
}

/* ───────── 컴포넌트 ───────── */
export default function AssetChick({ totalAssets, transactions, budgets, monthStartDay }: Props) {
  const safeAssets = Math.max(totalAssets, 0);
  const level = Math.min(MAX_LEVEL, Math.floor(safeAssets / STEP) + 1);
  const levelBase = (level - 1) * STEP;
  const levelProgress = level >= MAX_LEVEL ? 1 : (safeAssets - levelBase) / STEP;
  const nextAmount = level * STEP;
  const stage = stageOf(level);
  const nextStage = STAGES.find((s) => s.from > level);
  const intensity = intensityOf(level);

  const lines = useMemo(
    () =>
      buildChickLines({
        transactions,
        budgets,
        monthStartDay,
        level,
        maxLevel: MAX_LEVEL,
        levelProgress,
        toNextLevel: Math.max(nextAmount - safeAssets, 0),
      }),
    [transactions, budgets, monthStartDay, level, levelProgress, nextAmount, safeAssets]
  );

  // 무작위 값은 화면이 뜬 뒤에 정해야 서버/클라이언트 불일치가 없음
  const [pickState, setPickState] = useState<{ idx: number; textIdx: number } | null>(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    setPickState(pickLine(lines, null));
    setTries(0);
  }, [lines]);

  const line = pickState ? lines[pickState.idx] ?? lines[0] : null;
  const lineText = line && pickState ? line.texts[pickState.textIdx % line.texts.length] : null;
  const candidates = line ? MOOD_FALLBACK[line.mood] : [];
  const variant = candidates[tries] ?? null;
  const imageFailed = !!line && tries >= candidates.length;
  const src = variant ? `/chicks/lv${String(level).padStart(2, "0")}_${variant}.png` : null;
  const onImgError = () => setTries((t) => t + 1);

  const nextLine = () => {
    setTries(0);
    setPickState((p) => pickLine(lines, p?.idx ?? null));
  };

  // 연출 강도(1~10)에 따라 파티클 수·오라 세기 조절
  const particleCount = 3 + Math.round(intensity * 0.8);
  const glowScale = 0.75 + intensity * 0.035;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <div>
      <style>{`
        @keyframes chickBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes chickGlow { 0%,100% { opacity: .65; transform: translate(-50%,-50%) scale(.92) } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.06) } }
        @keyframes chickRing { from { transform: translate(-50%,-50%) rotate(0deg) } to { transform: translate(-50%,-50%) rotate(360deg) } }
        @keyframes chickFloat { 0% { transform: translateY(0) scale(.7); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(-120px) scale(1.05); opacity: 0 } }
        @keyframes chickPulse { 0% { transform: translate(-50%,-50%) scale(.5); opacity: .9 } 100% { transform: translate(-50%,-50%) scale(1.35); opacity: 0 } }
        @keyframes chickFloor { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        @keyframes chickPillar { 0%,100% { opacity: .35; transform: scaleY(.9) } 50% { opacity: .85; transform: scaleY(1.05) } }
        @keyframes bubbleIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* 무대 */}
      <div
        style={{
          position: "relative",
          height: 220,
          borderRadius: 20,
          overflow: "hidden",
          // 초원 배경 + (이미지 로딩 전/실패 시) 단계 색
          background: `url(/chicks/bg_meadow.jpg) center 62% / cover no-repeat, ${stage.bg}`,
          marginTop: 12,
        }}
      >
        {/* 진화 단계 색을 살짝 얹어 분위기만 바꿈 */}
        <div style={{ position: "absolute", inset: 0, background: stage.bg, opacity: stage.from >= 31 ? 0.28 : 0.12, pointerEvents: "none" }} />
        {/* 빛기둥 (불사조 신화) */}
        {stage.pillars &&
          [18, 36, 64, 82].map((left, i) => (
            <span
              key={`p${i}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                bottom: 0,
                width: 14,
                height: "100%",
                marginLeft: -7,
                background: "linear-gradient(0deg, rgba(255,190,70,0.75) 0%, rgba(255,230,150,0.25) 70%, transparent 100%)",
                filter: "blur(3px)",
                transformOrigin: "bottom",
                animation: `chickPillar ${2.4 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}

        {/* 오라 */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            width: 170 * glowScale,
            height: 170 * glowScale,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${stage.glow} 0%, transparent 68%)`,
            animation: "chickGlow 2.6s ease-in-out infinite",
          }}
        />

        {/* 퍼지는 파동 */}
        {stage.pulse &&
          [0, 1].map((i) => (
            <div
              key={`w${i}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "52%",
                width: 170,
                height: 170,
                borderRadius: "50%",
                border: `2px solid ${stage.pulse}`,
                animation: `chickPulse 2.8s ease-out ${i * 1.4}s infinite`,
              }}
            />
          ))}

        {/* 회전 광륜 */}
        {stage.ring && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              width: 178,
              height: 178,
              borderRadius: "50%",
              background: stage.ring,
              WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%, #000 66%, transparent 68%)",
              mask: "radial-gradient(circle, transparent 58%, #000 60%, #000 66%, transparent 68%)",
              animation: `chickRing ${stage.from === 46 ? 14 : 3.2}s linear infinite`,
            }}
          />
        )}

        {/* 발밑 빛 링 */}
        {Array.from({ length: stage.floorRings }, (_, i) => (
          <div
            key={`f${i}`}
            style={{
              position: "absolute",
              left: "50%",
              bottom: 22 - i * 3,
              width: 96 + i * 26,
              height: 18 + i * 5,
              marginLeft: -(48 + i * 13),
              borderRadius: "50%",
              border: `2px solid ${stage.floorColor}`,
              boxShadow: `0 0 10px ${stage.floorColor}`,
              animation: `chickFloor ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}

        {/* 떠오르는 파티클 */}
        {particles.map((i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${14 + ((i * 13) % 72)}%`,
              bottom: 12,
              fontSize: 13,
              animation: `chickFloat ${2.8 + (i % 3) * 0.7}s ease-in ${i * 0.45}s infinite`,
              pointerEvents: "none",
            }}
          >
            {stage.particle === "dot" ? (
              <span
                style={{
                  display: "block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: stage.particleColor,
                  boxShadow: `0 0 6px ${stage.particleColor}`,
                }}
              />
            ) : (
              stage.particle
            )}
          </span>
        ))}

        {/* 발밑 그림자 (풀밭에 서 있는 느낌) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 24,
            width: 92,
            height: 16,
            marginLeft: -46,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(30,60,10,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

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
            width: 150,
            height: 150,
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
          LV.{level} · {stage.title}
        </div>
      </div>

      {/* 한줄평 말풍선 */}
      <div
        key={`${pickState?.idx ?? -1}-${pickState?.textIdx ?? -1}`}
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
        {line?.kind === "advice" && (
          <span
            style={{
              display: "inline-block",
              marginRight: 6,
              padding: "1px 7px",
              borderRadius: 999,
              background: "#FFE9A8",
              color: "#8A6200",
              fontSize: 10,
              fontWeight: 900,
              verticalAlign: 1,
            }}
          >
            조언
          </span>
        )}
        {lineText ?? "..."}
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
        <div style={{ marginTop: 5, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#B0A8C8" }}>
          <span>
            {nextStage ? `LV.${nextStage.from}에서 ${withRo(nextStage.title)} 진화` : "최종 진화 완료"}
          </span>
          <span>목표 5억 · 1레벨 1,000만원</span>
        </div>
      </div>
    </div>
  );
}
