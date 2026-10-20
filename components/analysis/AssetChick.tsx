"use client";

import { useEffect, useMemo, useState } from "react";
import { buildChickLines, type ChickLine, type ChickTx, type Mood } from "@/components/analysis/chickLines";

/**
 * 우리의 외계인 👽 — 영웅 6명 키우기
 *
 * - 목표 자산(5억)을 60단계로 나눠 레벨 1~60 (1레벨 ≈ 833만원)
 * - 10레벨마다 새 영웅이 착륙: 기사 → 팔라딘 → 검사 → 법사 → 궁수 → 힐러
 * - 각 영웅의 1~2단계는 공통 모습(아기 외계인), 3~10단계는 직업별 모습
 * - 이미지: public/aliens/
 *     공통   common_lv01_{mood}.webp, common_lv02_{mood}.webp
 *     직업별 {key}_lvNN_{mood}.webp  (key: knight·paladin·sword·mage·archer·healer, NN = 03~10)
 *   mood: happy 웃음 · surprised 놀람 · neutral 무표정 · sad 울음 · angry 화남
 *   빠진 단계 이미지는 MISSING에 적어두면 바로 아래 단계 이미지로 대신 보여줌
 * - 배경: public/aliens/bg_village.jpg (외계인 마을)
 */

const GOAL = 500_000_000; // 목표 5억
const MAX_LEVEL = 60;
const STEP = GOAL / MAX_LEVEL; // 레벨당 약 833만원

type Props = {
  totalAssets: number;
  transactions: ChickTx[];
  budgets: Record<string, number>;
  monthStartDay: number;
};

/* ───────── 영웅 6명 ───────── */
type Hero = {
  no: number;
  from: number;
  to: number;
  key: string; // 이미지 파일 이름 앞부분
  cls: string; // 직업 이름
  names: string[]; // 3~10단계 이름 (실제 이미지 외형 기준)
  tint: string; // 배경 위에 살짝 얹는 색
  glow: string; // 캐릭터 뒤 오라 색
  accent: string; // 빛 입자·텔레포트 빔 색
  particles: [string, string]; // [초반, 후반(6단계~)] 이모지 또는 "dot"
};

// 모든 영웅 공통 1~2단계
const COMMON_NAMES = ["아기 외계인", "꼬마 외계인"];

const HEROES: Hero[] = [
  {
    no: 1, from: 1, to: 10, key: "knight", cls: "기사",
    names: ["스카프 수습생", "망토 수습생", "별배지 정찰병", "깃발 정찰대장", "견습 기사", "왕관 기사", "푸른별 기사", "은하 수호기사"],
    tint: "linear-gradient(180deg,#F1FFE4 0%,#EAF2FF 100%)", glow: "rgba(170,230,120,0.55)", accent: "rgba(110,170,255,0.8)", particles: ["dot", "⭐"],
  },
  {
    no: 2, from: 11, to: 20, key: "paladin", cls: "팔라딘",
    names: ["나무방패 수련생", "별방패 수련생", "금빛 방패병", "문장 방패병", "견습 팔라딘", "날개방패 팔라딘", "보석관 팔라딘", "성광 팔라딘"],
    tint: "linear-gradient(180deg,#FFF9E8 0%,#EEF3FF 100%)", glow: "rgba(255,215,120,0.6)", accent: "rgba(255,200,90,0.8)", particles: ["dot", "✨"],
  },
  {
    no: 3, from: 21, to: 30, key: "sword", cls: "검사",
    names: ["목검 수련생", "철검 수련생", "견습 검사", "망토 검사", "푸른칼 검사", "숙련 검사", "수정검 검사", "성검 마스터"],
    tint: "linear-gradient(180deg,#EEF4FF 0%,#F4F1FF 100%)", glow: "rgba(130,180,255,0.6)", accent: "rgba(120,170,255,0.8)", particles: ["dot", "⚔️"],
  },
  {
    no: 4, from: 31, to: 40, key: "mage", cls: "법사",
    names: ["후드 견습생", "견습 마법사", "초급 마법사", "별빛 마법사", "왕관 마법사", "성운 마법사", "대마법사", "은하 대마법사"],
    tint: "linear-gradient(180deg,#EFEAFF 0%,#E6F0FF 100%)", glow: "rgba(160,140,255,0.6)", accent: "rgba(140,120,255,0.8)", particles: ["✨", "🌟"],
  },
  {
    no: 5, from: 41, to: 50, key: "archer", cls: "궁수",
    names: ["꼬마 궁수", "새싹 궁수", "숲지기 궁수", "망토 궁수", "바람 궁수", "잎새 명궁", "깃털 명궁", "은하 명궁"],
    tint: "linear-gradient(180deg,#EFFFF0 0%,#E9F6FF 100%)", glow: "rgba(140,220,150,0.6)", accent: "rgba(110,200,140,0.8)", particles: ["🍃", "✨"],
  },
  {
    no: 6, from: 51, to: 60, key: "healer", cls: "힐러",
    names: [], // 이미지 다시 작업 중 → 들어오면 3~10단계 이름 채우기
    tint: "linear-gradient(180deg,#FFFCEF 0%,#EEF2FF 100%)", glow: "rgba(255,230,150,0.7)", accent: "rgba(255,215,120,0.85)", particles: ["✨", "💖"],
  },
];

// 아직 이미지가 없는 단계 → 바로 아래 단계 이미지로 대신 표시
const MISSING: Record<string, number[]> = { sword: [8] };
// 3~10단계 이미지가 아직 없는 영웅 → 🛸 + "???"로 표시
const NOT_READY = ["healer"];

const heroOf = (level: number) => HEROES.find((h) => level >= h.from && level <= h.to) || HEROES[0];
const stepOf = (level: number) => level - heroOf(level).from + 1; // 영웅 안에서 1~10단계
const nameOf = (level: number) => {
  const step = stepOf(level);
  return step <= 2 ? COMMON_NAMES[step - 1] : heroOf(level).names[step - 3] ?? "???";
};
const alienSrc = (level: number, mood: Mood): string | null => {
  const hero = heroOf(level);
  let step = stepOf(level);
  if (step <= 2) return `/aliens/common_lv0${step}_${mood}.webp`;
  if (NOT_READY.includes(hero.key)) return null;
  while (step > 3 && MISSING[hero.key]?.includes(step)) step--;
  return `/aliens/${hero.key}_lv${String(step).padStart(2, "0")}_${mood}.webp`;
};

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

/* ───────── 영웅 슬롯 (아래 6칸) ───────── */
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
  const step = stepOf(level); // 이 영웅 안에서 몇 번째 단계인지 (1~10)
  const levelName = nameOf(level);

  // 연출: 영웅 안에서 단계가 오를수록 화려해짐
  const fx = {
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
    if (level >= MAX_LEVEL) return "영웅 6명 수련 완료!";
    const next = level + 1;
    if (next > hero.to) return `LV.${next}에서 ${HEROES[hero.no]?.cls ?? "새 영웅"} 착륙`;
    if (nameOf(next) !== "???") return `LV.${next}에서 ${withRo(nameOf(next))} 진화`;
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
        @keyframes alienFloat { 0% { transform: translateY(0) scale(.7); opacity: 0 } 15% { opacity: 1 } 100% { transform: translateY(-120px) scale(1.05); opacity: 0 } }
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
          {hero.no}번째 영웅 · {hero.cls}
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
          <span>목표 5억 · 1레벨 약 833만원</span>
        </div>
      </div>

      {/* 영웅 6명 */}
      <div style={{ marginTop: 14, padding: "10px 6px 8px", borderRadius: 16, background: "#FAF8FF", display: "flex", gap: 4 }}>
        {HEROES.map((h) => (
          <HeroSlot key={h.no} hero={h} level={level} />
        ))}
      </div>
    </div>
  );
}
