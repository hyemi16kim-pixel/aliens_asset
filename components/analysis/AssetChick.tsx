"use client";

import { useEffect, useMemo, useState } from "react";
import { buildChickLines, type ChickLine, type ChickTx, type Mood } from "@/components/analysis/chickLines";

/**
 * 우리의 외계인 👽 — 영웅 5명 키우기
 *
 * - 목표 자산(5억)을 50단계로 나눠 레벨 1~50 (1레벨 = 1,000만원)
 * - 10레벨마다 새 영웅이 착륙: 1번 LV.1~10 · 2번 LV.11~20 · 3번 LV.21~30 · 4번 LV.31~40 · 5번 LV.41~50
 * - 레벨마다 모습이 한 단계씩 바뀜 (외계인마을 폴더 lv1~lv20 이미지)
 * - 이미지: public/aliens/lvNN_{mood}.webp   (NN = 01, 02 … 20)
 *   mood: happy 웃음 · surprised 놀람 · neutral 무표정 · sad 울음 · angry 화남
 * - LV.21 이후는 아직 디자인 미정 → 🛸 + "???"로 표시
 *   새 이미지를 넣으면 READY_LEVEL 숫자와 LEVEL_NAMES 이름만 늘려주면 됨
 * - 배경: public/aliens/bg_village.jpg (외계인 마을)
 */

const GOAL = 500_000_000; // 목표 5억
const MAX_LEVEL = 50;
const STEP = GOAL / MAX_LEVEL; // 레벨당 1,000만원
const READY_LEVEL = 20; // 이미지가 준비된 마지막 레벨

type Props = {
  totalAssets: number;
  transactions: ChickTx[];
  budgets: Record<string, number>;
  monthStartDay: number;
};

/* ───────── 레벨별 이름 (실제 이미지 외형 기준) ───────── */
const LEVEL_NAMES: Record<number, string> = {
  // 1번 영웅 — 탐험가 → 기사
  1: "아기 외계인", // 맨몸 + 작은 가방
  2: "꼬마 탐험가", // 새싹 배지 가방 + 두루마리
  3: "스카프 탐험가", // 파란 스카프 + 벨트
  4: "망토 탐험가", // 짧은 망토 + 새싹
  5: "별배지 정찰병", // 별 배지 + 나침반
  6: "깃발 정찰대장", // 등에 깃발
  7: "견습 기사", // 금빛 더듬이 캡 + 갑옷 부츠
  8: "왕관 기사", // 보석 왕관 + 갑옷 망토
  9: "푸른별 기사", // 파란 보주 더듬이
  10: "은하 수호기사", // 작은 날개 + 크리스털 장식
  // 2번 영웅 — 책벌레 → 대마법사
  11: "꼬마 책벌레", // 작은 책 + 스카프
  12: "견습 학자", // 책 + 두루마리 + 짧은 망토
  13: "견습 마법사", // 마법사 모자 등장
  14: "초급 마법사", // 장식 달린 모자
  15: "별빛 마법사", // 별 무늬 모자·로브
  16: "보주 마법사", // 모자 벗고 파란 보주 더듬이
  17: "왕관 마법사", // 보석 왕관 + 마법 카드
  18: "성운 마법사", // 보석 모자 + 크리스털 장식
  19: "대마법사", // 별 보석 모자 + 보주 지팡이
  20: "은하 대마법사", // 화려한 왕관 모자 + 지팡이
};

/* ───────── 영웅 5명 ───────── */
type Hero = {
  no: number;
  from: number;
  to: number;
  cls: string; // 계열 이름 (미정이면 "???")
  tint: string; // 배경 위에 살짝 얹는 색
  glow: string; // 캐릭터 뒤 오라 색
  accent: string; // 링·파동·빛 입자 색
  particles: [string, string]; // [초반, 후반(6레벨차~)] 이모지 또는 "dot"
};

const HEROES: Hero[] = [
  { no: 1, from: 1, to: 10, cls: "기사", tint: "linear-gradient(180deg,#F1FFE4 0%,#EAF2FF 100%)", glow: "rgba(170,230,120,0.55)", accent: "rgba(110,170,255,0.8)", particles: ["dot", "⭐"] },
  { no: 2, from: 11, to: 20, cls: "마법사", tint: "linear-gradient(180deg,#EFEAFF 0%,#E6F0FF 100%)", glow: "rgba(160,140,255,0.6)", accent: "rgba(140,120,255,0.8)", particles: ["✨", "🌟"] },
  { no: 3, from: 21, to: 30, cls: "???", tint: "linear-gradient(180deg,#F3FFF6 0%,#EAF6FF 100%)", glow: "rgba(140,220,200,0.55)", accent: "rgba(110,210,190,0.8)", particles: ["dot", "✨"] },
  { no: 4, from: 31, to: 40, cls: "???", tint: "linear-gradient(180deg,#FFF6EA 0%,#FFEDE6 100%)", glow: "rgba(255,190,120,0.6)", accent: "rgba(255,170,100,0.8)", particles: ["dot", "✨"] },
  { no: 5, from: 41, to: 50, cls: "???", tint: "linear-gradient(180deg,#FFFBEA 0%,#EDE6FF 100%)", glow: "rgba(255,220,120,0.7)", accent: "rgba(255,210,100,0.85)", particles: ["⭐", "💎"] },
];

const heroOf = (level: number) => HEROES.find((h) => level >= h.from && level <= h.to) || HEROES[0];
const nameOf = (level: number) => LEVEL_NAMES[level] ?? "???";
const alienSrc = (level: number, mood: Mood) =>
  level <= READY_LEVEL ? `/aliens/lv${String(level).padStart(2, "0")}_${mood}.webp` : null;

// "꼬마 탐험가" → "꼬마 탐험가로" (받침 없거나 ㄹ이면 '로')
const withRo = (word: string) => {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${word}로`;
  const jong = (code - 0xac00) % 28;
  return `${word}${jong === 0 || jong === 8 ? "로" : "으로"}`;
};

const won = (v: number) =>
  v >= 100_000_000 ? `${(v / 100_000_000).toFixed(1)}억` : `${Math.round(v / 10_000).toLocaleString()}만`;

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

/* ───────── 영웅 슬롯 (아래 5칸) ───────── */
function HeroSlot({ hero, level }: { hero: Hero; level: number }) {
  const done = level > hero.to;
  const current = level >= hero.from && level <= hero.to;
  const shownLevel = done ? hero.to : current ? level : 0;
  const src = shownLevel ? alienSrc(shownLevel, done ? "happy" : "neutral") : null;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          background: current ? "#F5FDEB" : done ? "#F1EDFF" : "#F2F0F7",
          border: current ? "2px solid #9ED36A" : done ? "1.5px solid #C9BCFF" : "1.5px dashed #D6D0E6",
          boxShadow: current ? "0 0 0 3px rgba(158,211,106,0.25)" : "none",
        }}
      >
        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`${hero.no}번째 영웅`} onError={() => setFailed(true)} style={{ width: "118%", height: "118%", objectFit: "contain", marginTop: 6 }} />
        ) : (
          <span style={{ fontSize: shownLevel ? 22 : 15, color: "#C4BCD8", fontWeight: 900 }}>{shownLevel ? "🛸" : "?"}</span>
        )}
      </div>
      <span style={{ fontSize: 9, fontWeight: 800, color: current ? "#4C7A12" : done ? "#7C5CFF" : "#B8B0CC", whiteSpace: "nowrap" }}>
        {done ? "수련 완료" : current ? `${hero.no}번 · ${hero.cls}` : `LV.${hero.from}`}
      </span>
    </div>
  );
}

/* ───────── 컴포넌트 ───────── */
export default function AssetChick({ totalAssets, transactions, budgets, monthStartDay }: Props) {
  const safeAssets = Math.max(totalAssets, 0);
  const level = Math.min(MAX_LEVEL, Math.floor(safeAssets / STEP) + 1);
  const levelBase = (level - 1) * STEP;
  const levelProgress = level >= MAX_LEVEL ? 1 : (safeAssets - levelBase) / STEP;
  const nextAmount = level * STEP;
  const hero = heroOf(level);
  const step = level - hero.from + 1; // 이 영웅 안에서 몇 번째 단계인지 (1~10)
  const levelName = nameOf(level);

  // 연출: 영웅 안에서 단계가 오를수록 화려해짐
  const fx = {
    floorRings: step >= 7 ? 3 : step >= 5 ? 2 : step >= 3 ? 1 : 0,
    pulse: step >= 5,
    ring: step >= 8,
    beams: step >= 10,
    particle: step >= 6 ? hero.particles[1] : hero.particles[0],
  };

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
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setPickState(pickLine(lines, null));
    setImageFailed(false);
  }, [lines]);

  const line = pickState ? lines[pickState.idx] ?? lines[0] : null;
  const lineText = line && pickState ? line.texts[pickState.textIdx % line.texts.length] : null;
  const src = line ? alienSrc(level, line.mood) : null;

  const nextLine = () => {
    setImageFailed(false);
    setPickState((p) => pickLine(lines, p?.idx ?? null));
  };

  // 다음 단계 안내
  const nextInfo = (() => {
    if (level >= MAX_LEVEL) return "영웅 5명 수련 완료!";
    const next = level + 1;
    if (next > hero.to) return `LV.${next}에서 ${hero.no + 1}번째 영웅 착륙`;
    if (LEVEL_NAMES[next]) return `LV.${next}에서 ${withRo(LEVEL_NAMES[next])} 진화`;
    return `LV.${next} 모습은 준비 중`;
  })();

  const particleCount = 3 + Math.round(step * 0.8);
  const glowScale = 0.75 + step * 0.035;
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  return (
    <div>
      <style>{`
        @keyframes alienBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        @keyframes alienGlow { 0%,100% { opacity: .65; transform: translate(-50%,-50%) scale(.92) } 50% { opacity: 1; transform: translate(-50%,-50%) scale(1.06) } }
        @keyframes alienRing { from { transform: translate(-50%,-50%) rotate(0deg) } to { transform: translate(-50%,-50%) rotate(360deg) } }
        @keyframes alienFloat { 0% { transform: translateY(0) scale(.7); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(-120px) scale(1.05); opacity: 0 } }
        @keyframes alienPulse { 0% { transform: translate(-50%,-50%) scale(.5); opacity: .9 } 100% { transform: translate(-50%,-50%) scale(1.35); opacity: 0 } }
        @keyframes alienFloor { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        @keyframes alienBeam { 0%,100% { opacity: .35; transform: scaleY(.9) } 50% { opacity: .85; transform: scaleY(1.05) } }
        @keyframes bubbleIn { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* 무대 */}
      <div
        style={{
          position: "relative",
          height: 220,
          borderRadius: 20,
          overflow: "hidden",
          // 외계인 마을 배경 + (이미지 로딩 전/실패 시) 영웅 색
          background: `url(/aliens/bg_village.jpg) center 70% / cover no-repeat, ${hero.tint}`,
          marginTop: 12,
        }}
      >
        {/* 영웅 색을 살짝 얹어 분위기만 바꿈 */}
        <div style={{ position: "absolute", inset: 0, background: hero.tint, opacity: 0.12 + step * 0.012, pointerEvents: "none" }} />

        {/* 텔레포트 빔 (각 영웅의 마지막 단계) */}
        {fx.beams &&
          [18, 36, 64, 82].map((left, i) => (
            <span
              key={`b${i}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                bottom: 0,
                width: 14,
                height: "100%",
                marginLeft: -7,
                background: `linear-gradient(0deg, ${hero.accent} 0%, rgba(255,255,255,0.25) 70%, transparent 100%)`,
                filter: "blur(3px)",
                transformOrigin: "bottom",
                animation: `alienBeam ${2.4 + i * 0.3}s ease-in-out ${i * 0.4}s infinite`,
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
            background: `radial-gradient(circle, ${hero.glow} 0%, transparent 68%)`,
            animation: "alienGlow 2.6s ease-in-out infinite",
          }}
        />

        {/* 퍼지는 신호 파동 */}
        {fx.pulse &&
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
                border: `2px solid ${hero.accent}`,
                animation: `alienPulse 2.8s ease-out ${i * 1.4}s infinite`,
              }}
            />
          ))}

        {/* 회전 광륜 */}
        {fx.ring && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "52%",
              width: 178,
              height: 178,
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, transparent 0 58%, ${hero.accent} 78%, rgba(255,220,120,0.9) 88%, transparent 100%)`,
              WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%, #000 66%, transparent 68%)",
              mask: "radial-gradient(circle, transparent 58%, #000 60%, #000 66%, transparent 68%)",
              animation: `alienRing ${fx.beams ? 8 : 3.2}s linear infinite`,
            }}
          />
        )}

        {/* 발밑 착륙 링 */}
        {Array.from({ length: fx.floorRings }, (_, i) => (
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
              border: `2px solid ${hero.accent}`,
              boxShadow: `0 0 10px ${hero.accent}`,
              animation: `alienFloor ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
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
              animation: `alienFloat ${2.8 + (i % 3) * 0.7}s ease-in ${i * 0.45}s infinite`,
              pointerEvents: "none",
            }}
          >
            {fx.particle === "dot" ? (
              <span
                style={{
                  display: "block",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: hero.accent,
                  boxShadow: `0 0 6px ${hero.accent}`,
                }}
              />
            ) : (
              fx.particle
            )}
          </span>
        ))}

        {/* 발밑 그림자 */}
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

        {/* 외계인 */}
        <button
          type="button"
          onClick={nextLine}
          aria-label="외계인에게 교신하기"
          style={{
            position: "absolute",
            left: "50%",
            top: "52%",
            transform: "translate(-50%,-50%)",
            width: 156,
            height: 156,
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <div style={{ width: "100%", height: "100%", animation: "alienBob 2.2s ease-in-out infinite", display: "grid", placeItems: "center" }}>
            {src && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`LV.${level} ${levelName}`}
                onError={() => setImageFailed(true)}
                style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 6px 8px rgba(40,80,20,0.2))" }}
              />
            ) : (
              <span style={{ fontSize: 76, lineHeight: 1 }}>🛸</span>
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
            color: "#C9F27A",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: 0.3,
          }}
        >
          LV.{level} · {levelName}
        </div>
        {/* 몇 번째 영웅인지 */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "4px 9px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.85)",
            color: "#6B5BB5",
            fontSize: 10,
            fontWeight: 900,
          }}
        >
          {hero.no}번째 영웅
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
          background: "#F5FDEB",
          border: "1.5px solid #CDEBA8",
          fontSize: 13,
          fontWeight: 700,
          color: "#3F5A22",
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
            background: "#F5FDEB",
            borderLeft: "1.5px solid #CDEBA8",
            borderTop: "1.5px solid #CDEBA8",
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
              background: "#DDF3BE",
              color: "#4C7A12",
              fontSize: 10,
              fontWeight: 900,
              verticalAlign: 1,
            }}
          >
            📡 조언
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
              background: "linear-gradient(90deg, #B8E986, #6FD3B5)",
              borderRadius: 999,
              transition: "width 1.2s ease",
            }}
          />
        </div>
        <div style={{ marginTop: 5, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#B0A8C8" }}>
          <span>{nextInfo}</span>
          <span>목표 5억 · 1레벨 1,000만원</span>
        </div>
      </div>

      {/* 영웅 5명 */}
      <div style={{ marginTop: 14, padding: "10px 6px 8px", borderRadius: 16, background: "#FAF8FF", display: "flex", gap: 4 }}>
        {HEROES.map((h) => (
          <HeroSlot key={h.no} hero={h} level={level} />
        ))}
      </div>
    </div>
  );
}
